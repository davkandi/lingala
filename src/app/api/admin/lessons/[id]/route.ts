import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lessons, lessonMaterials } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lesson ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const lessonId = parseInt(id);

    const existingLesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, videoUrl, orderIndex, durationMinutes, freePreview } = body;

    const updateData: Record<string, any> = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string') {
        return NextResponse.json(
          { error: 'Content must be a string', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (videoUrl !== undefined) {
      if (videoUrl !== null && typeof videoUrl !== 'string') {
        return NextResponse.json(
          { error: 'Video URL must be a string or null', code: 'INVALID_VIDEO_URL' },
          { status: 400 }
        );
      }
      updateData.videoUrl = videoUrl ? videoUrl.trim() : null;
    }

    if (orderIndex !== undefined) {
      if (typeof orderIndex !== 'number' || orderIndex < 0) {
        return NextResponse.json(
          { error: 'Order index must be a non-negative number', code: 'INVALID_ORDER_INDEX' },
          { status: 400 }
        );
      }
      updateData.orderIndex = orderIndex;
    }

    if (durationMinutes !== undefined) {
      if (typeof durationMinutes !== 'number' || durationMinutes < 0) {
        return NextResponse.json(
          { error: 'Duration minutes must be a non-negative number', code: 'INVALID_DURATION' },
          { status: 400 }
        );
      }
      updateData.durationMinutes = durationMinutes;
    }

    if (freePreview !== undefined) {
      if (typeof freePreview !== 'boolean') {
        return NextResponse.json(
          { error: 'Free preview must be a boolean', code: 'INVALID_FREE_PREVIEW' },
          { status: 400 }
        );
      }
      updateData.freePreview = freePreview;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updatedLesson = await db.update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId))
      .returning();

    return NextResponse.json(updatedLesson[0], { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('PATCH /api/admin/lessons/[id] error:', error);
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
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid lesson ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const lessonId = parseInt(id);

    const existingLesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedMaterials = await db.delete(lessonMaterials)
      .where(eq(lessonMaterials.lessonId, lessonId))
      .returning();

    const deletedLesson = await db.delete(lessons)
      .where(eq(lessons.id, lessonId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Lesson and associated materials deleted successfully',
      deletedMaterialsCount: deletedMaterials.length,
      deletedLesson: deletedLesson[0]
    }, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('DELETE /api/admin/lessons/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}