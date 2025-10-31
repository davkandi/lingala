import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, modules, lessons } from "@/db/postgres-schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const publishedCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true));
    
    // Get module and lesson counts for each course
    const coursesWithCounts = await Promise.all(
      publishedCourses.map(async (course) => {
        const courseModules = await db
          .select()
          .from(modules)
          .where(eq(modules.courseId, course.id));
        const moduleIds = courseModules.map(m => m.id);
        
        let lessonCount = 0;
        for (const moduleId of moduleIds) {
          const moduleLessons = await db
            .select()
            .from(lessons)
            .where(eq(lessons.moduleId, moduleId));
          lessonCount += moduleLessons.length;
        }
        
        return {
          ...course,
          moduleCount: courseModules.length,
          lessonCount,
        };
      })
    );

    return NextResponse.json(coursesWithCounts);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
