import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { courses, modules, lessons, lessonMaterials } from '@/db/postgres-schema';
import { eq, asc, and, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    const courseId = parseInt(id);

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const courseModules = await db.select()
      .from(modules)
      .where(
        and(
          eq(modules.courseId, courseId),
          eq(modules.sourceLanguage, course[0].sourceLanguage)
        )
      )
      .orderBy(asc(modules.orderIndex));

    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await db.select()
          .from(lessons)
          .where(
            and(
              eq(lessons.moduleId, module.id),
              eq(lessons.sourceLanguage, course[0].sourceLanguage)
            )
          )
          .orderBy(asc(lessons.orderIndex));

        return {
          ...module,
          lessons: moduleLessons
        };
      })
    );

    const courseWithModules = {
      ...course[0],
      modules: modulesWithLessons
    };

    return NextResponse.json(courseWithModules, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    const courseId = parseInt(id);

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, level, language, sourceLanguage, thumbnailUrl, price, isPublished } = body;

    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };

    let normalizedSourceLanguage: "en" | "fr" | null = null;
    let shouldSyncChildLanguages = false;

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (language !== undefined) updateData.language = language;
    if (sourceLanguage !== undefined) {
      normalizedSourceLanguage = sourceLanguage === 'fr' ? 'fr' : 'en';
      updateData.sourceLanguage = normalizedSourceLanguage;
      if (normalizedSourceLanguage !== existingCourse[0].sourceLanguage) {
        shouldSyncChildLanguages = true;
      }
    }
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (price !== undefined) updateData.price = price;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedCourse = await db.update(courses)
      .set(updateData)
      .where(eq(courses.id, courseId))
      .returning();

    if (updatedCourse.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update course', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    if (shouldSyncChildLanguages && normalizedSourceLanguage) {
      await db.update(modules)
        .set({ sourceLanguage: normalizedSourceLanguage })
        .where(eq(modules.courseId, courseId));

      const moduleIds = await db
        .select({ id: modules.id })
        .from(modules)
        .where(eq(modules.courseId, courseId));

      if (moduleIds.length > 0) {
        await db.update(lessons)
          .set({ sourceLanguage: normalizedSourceLanguage })
          .where(inArray(lessons.moduleId, moduleIds.map((module) => module.id)));
      }
    }

    return NextResponse.json(updatedCourse[0], { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    const courseId = parseInt(id);

    if (!courseId || isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    let deletedCounts = {
      lessonMaterials: 0,
      lessons: 0,
      modules: 0,
      courses: 0
    };

    const courseModules = await db.select()
      .from(modules)
      .where(eq(modules.courseId, courseId));

    for (const courseModule of courseModules) {
      const moduleLessons = await db.select()
        .from(lessons)
        .where(eq(lessons.moduleId, courseModule.id));

      for (const lesson of moduleLessons) {
        const deletedMaterials = await db.delete(lessonMaterials)
          .where(eq(lessonMaterials.lessonId, lesson.id))
          .returning();
        deletedCounts.lessonMaterials += deletedMaterials.length;
      }

      const deletedLessons = await db.delete(lessons)
        .where(eq(lessons.moduleId, courseModule.id))
        .returning();
      deletedCounts.lessons += deletedLessons.length;
    }

    const deletedModules = await db.delete(modules)
      .where(eq(modules.courseId, courseId))
      .returning();
    deletedCounts.modules += deletedModules.length;

    const deletedCourse = await db.delete(courses)
      .where(eq(courses.id, courseId))
      .returning();
    deletedCounts.courses += deletedCourse.length;

    return NextResponse.json(
      {
        message: 'Course and all related records deleted successfully',
        deletedCounts,
        deletedCourse: deletedCourse[0]
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
