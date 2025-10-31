import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, modules, lessons, userProgress } from '@/db/postgres-schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Validate courseId is a valid integer
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { 
          error: 'Valid course ID is required',
          code: 'INVALID_COURSE_ID' 
        },
        { status: 400 }
      );
    }

    const parsedCourseId = parseInt(courseId);

    // Fetch course by ID
    const courseResult = await db.select()
      .from(courses)
      .where(eq(courses.id, parsedCourseId))
      .limit(1);

    if (courseResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const course = courseResult[0];

    // Fetch all modules for the course ordered by orderIndex
    const modulesResult = await db.select()
      .from(modules)
      .where(eq(modules.courseId, parsedCourseId))
      .orderBy(asc(modules.orderIndex));

    // Check if user is authenticated
    let userId: string | null = null;
    let userProgressMap: Map<number, any> = new Map();

    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        userId = session.user.id;

        // Fetch all lessons for the course to get their IDs
        const allLessonsIds = await db.select({ id: lessons.id })
          .from(lessons)
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .where(eq(modules.courseId, parsedCourseId));

        if (allLessonsIds.length > 0) {
          const lessonIds = allLessonsIds.map(l => l.id);

          // Fetch user progress for all lessons in the course
          const progressResults = await db.select()
            .from(userProgress)
            .where(eq(userProgress.userId, userId));

          // Create a map of lessonId -> progress for quick lookup
          progressResults.forEach(progress => {
            if (lessonIds.includes(progress.lessonId!)) {
              userProgressMap.set(progress.lessonId!, {
                completed: progress.completed,
                completedAt: progress.completedAt,
                lastPositionSeconds: progress.lastPositionSeconds
              });
            }
          });
        }
      }
    } catch (error) {
      // User not authenticated or session error, continue without progress
      console.log('User not authenticated or session error:', error);
    }

    // Build modules array with nested lessons
    const modulesWithLessons = await Promise.all(
      modulesResult.map(async (module) => {
        // Fetch lessons for this module ordered by orderIndex
        const lessonsResult = await db.select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(asc(lessons.orderIndex));

        // Add progress to each lesson if user is authenticated
        const lessonsWithProgress = lessonsResult.map(lesson => ({
          ...lesson,
          progress: userProgressMap.has(lesson.id) 
            ? userProgressMap.get(lesson.id) 
            : null
        }));

        return {
          ...module,
          lessons: lessonsWithProgress
        };
      })
    );

    // Build response structure
    const response = {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        language: course.language,
        sourceLanguage: course.sourceLanguage,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      },
      modules: modulesWithLessons
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET course structure error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
