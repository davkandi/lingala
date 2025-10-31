import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userEnrollments, courses, userProgress, lessons, modules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enrollments = await db
      .select()
      .from(userEnrollments)
      .where(eq(userEnrollments.userId, session.user.id));

    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await db
          .select()
          .from(courses)
          .where(eq(courses.id, enrollment.courseId))
          .limit(1);
        
        // Get the most recent progress for this course
        const recentProgress = await db
          .select({
            lessonId: userProgress.lessonId,
            updatedAt: userProgress.updatedAt
          })
          .from(userProgress)
          .where(eq(userProgress.userId, session.user.id))
          .orderBy(desc(userProgress.updatedAt))
          .limit(100); // Get recent progress records

        // Filter progress for lessons in this course
        let lastViewedLesson = null;
        if (recentProgress.length > 0) {
          // Get all lesson IDs from progress
          const lessonIds = recentProgress.map(p => p.lessonId);
          
          // Fetch lessons with their module info to find which belong to this course
          const progressLessons = await db
            .select({
              lessonId: lessons.id,
              lessonTitle: lessons.title,
              moduleId: lessons.moduleId,
              progressUpdatedAt: userProgress.updatedAt
            })
            .from(lessons)
            .innerJoin(userProgress, eq(lessons.id, userProgress.lessonId))
            .where(eq(userProgress.userId, session.user.id))
            .orderBy(desc(userProgress.updatedAt));

          // Find lessons that belong to this course
          for (const pl of progressLessons) {
            const lessonModule = await db
              .select()
              .from(lessons)
              .innerJoin(modules, eq(lessons.moduleId, modules.id))
              .where(eq(lessons.id, pl.lessonId))
              .limit(1);

            if (lessonModule.length > 0 && lessonModule[0].modules.courseId === enrollment.courseId) {
              lastViewedLesson = {
                lessonId: pl.lessonId,
                lessonTitle: pl.lessonTitle,
                moduleId: pl.moduleId
              };
              break;
            }
          }
        }
        
        return {
          ...enrollment,
          course: course[0],
          lastViewedLesson
        };
      })
    );

    return NextResponse.json(enrollmentsWithCourses);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    const newEnrollment = await db.insert(userEnrollments).values({
      userId: session.user.id,
      courseId,
      enrolledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, enrollment: newEnrollment });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}