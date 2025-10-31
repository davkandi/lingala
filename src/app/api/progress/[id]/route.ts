import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { courses, modules, lessons, userProgress } from '@/db/postgres-schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await auth.api.getSession({ 
      headers: await headers() 
    });

    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: courseId } = await params;

    // 2. Validate courseId
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { 
          error: 'Valid course ID is required',
          code: 'INVALID_COURSE_ID'
        },
        { status: 400 }
      );
    }

    const courseIdInt = parseInt(courseId);

    // 3. Verify course exists
    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, courseIdInt))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { 
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // 4. Get all modules for the course
    const courseModules = await db.select()
      .from(modules)
      .where(eq(modules.courseId, courseIdInt));

    // 5. Get all lessons for those modules
    const moduleIds = courseModules.map(m => m.id);
    
    let allLessons: any[] = [];
    if (moduleIds.length > 0) {
      allLessons = await db.select()
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds));
    }

    const lessonIds = allLessons.map(l => l.id);

    // 6. Query user progress for the authenticated user
    let progress: any[] = [];
    if (lessonIds.length > 0) {
      progress = await db.select()
        .from(userProgress)
        .where(
          eq(userProgress.userId, userId)
        );
      
      // Filter progress to only include lessons from this course
      progress = progress.filter(p => lessonIds.includes(p.lessonId));
    }

    // 7. Calculate statistics
    const total = allLessons.length;
    const completed = progress.filter(p => p.completed === true).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 8. Return response
    return NextResponse.json({
      progress,
      stats: {
        completed,
        total,
        percentage
      }
    });

  } catch (error) {
    console.error('GET progress error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}