import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, modules, userEnrollments } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, lessonId } = body;

    // Validate required fields
    if (!videoUrl) {
      return NextResponse.json(
        { 
          error: 'Video URL is required',
          code: 'MISSING_VIDEO_URL' 
        },
        { status: 400 }
      );
    }

    if (!lessonId) {
      return NextResponse.json(
        { 
          error: 'Lesson ID is required',
          code: 'MISSING_LESSON_ID' 
        },
        { status: 400 }
      );
    }

    // Validate lessonId is a valid number
    const parsedLessonId = parseInt(lessonId);
    if (isNaN(parsedLessonId)) {
      return NextResponse.json(
        { 
          error: 'Invalid lesson ID format',
          code: 'INVALID_LESSON_ID' 
        },
        { status: 400 }
      );
    }

    // Verify lesson exists and get lesson details
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parsedLessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { 
          error: 'Lesson not found',
          code: 'LESSON_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const lessonData = lesson[0];

    // Get session
    const session = await auth.api.getSession({ headers: await headers() });

    // Check if lesson is free preview
    if (lessonData.freePreview === true) {
      // Free preview - allow access without authentication
      const signedUrl = videoUrl;
      const expiresIn = 600;

      return NextResponse.json(
        {
          signedUrl,
          expiresIn
        },
        { status: 200 }
      );
    }

    // Not free preview - require authentication
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED' 
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get the module to find courseId
    if (!lessonData.moduleId) {
      return NextResponse.json(
        { 
          error: 'Lesson is not associated with a module',
          code: 'INVALID_LESSON_STRUCTURE' 
        },
        { status: 400 }
      );
    }

    const moduleRecord = await db.select()
      .from(modules)
      .where(eq(modules.id, lessonData.moduleId))
      .limit(1);

    if (moduleRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Module not found',
          code: 'MODULE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const moduleData = moduleRecord[0];

    if (!moduleData.courseId) {
      return NextResponse.json(
        { 
          error: 'Module is not associated with a course',
          code: 'INVALID_MODULE_STRUCTURE' 
        },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await db.select()
      .from(userEnrollments)
      .where(
        and(
          eq(userEnrollments.userId, userId),
          eq(userEnrollments.courseId, moduleData.courseId)
        )
      )
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json(
        { 
          error: 'User is not enrolled in this course',
          code: 'NOT_ENROLLED' 
        },
        { status: 403 }
      );
    }

    // All checks passed - generate signed URL
    const signedUrl = videoUrl;
    const expiresIn = 600;

    return NextResponse.json(
      {
        signedUrl,
        expiresIn
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/videos/signed-url error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
