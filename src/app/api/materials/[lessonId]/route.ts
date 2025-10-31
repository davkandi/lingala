import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, modules, lessonMaterials, userEnrollments } from '@/db/postgres-schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // Validate lessonId is a valid integer
    if (!lessonId || isNaN(parseInt(lessonId))) {
      return NextResponse.json(
        { 
          error: "Valid lesson ID is required",
          code: "INVALID_LESSON_ID" 
        },
        { status: 400 }
      );
    }

    const lessonIdInt = parseInt(lessonId);

    // Fetch lesson by ID
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonIdInt))
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

    // Get the lesson's module to find courseId
    const module = await db.select()
      .from(modules)
      .where(eq(modules.id, lessonData.moduleId!))
      .limit(1);

    if (module.length === 0) {
      return NextResponse.json(
        { 
          error: 'Module not found for this lesson',
          code: 'MODULE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const courseId = module[0].courseId;

    // Check if lesson has freePreview
    if (lessonData.freePreview === true) {
      // Free preview - allow access without authentication
      const materials = await db.select()
        .from(lessonMaterials)
        .where(eq(lessonMaterials.lessonId, lessonIdInt))
        .orderBy(asc(lessonMaterials.id));

      return NextResponse.json(materials, { status: 200 });
    }

    // Not free preview - require authentication
    const session = await auth.api.getSession({ 
      headers: await headers() 
    });

    if (!session) {
      return NextResponse.json(
        { 
          error: 'Authentication required to access lesson materials',
          code: 'AUTHENTICATION_REQUIRED' 
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is enrolled in the course
    const enrollment = await db.select()
      .from(userEnrollments)
      .where(eq(userEnrollments.userId, userId))
      .where(eq(userEnrollments.courseId, courseId!))
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

    // All checks passed, fetch lesson materials
    const materials = await db.select()
      .from(lessonMaterials)
      .where(eq(lessonMaterials.lessonId, lessonIdInt))
      .orderBy(asc(lessonMaterials.id));

    return NextResponse.json(materials, { status: 200 });

  } catch (error) {
    console.error('GET lesson materials error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}