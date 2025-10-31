import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modules, lessons } from '@/db/postgres-schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const { moduleId, title, content, videoUrl, orderIndex, durationMinutes, freePreview } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required', code: 'MISSING_MODULE_ID' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Valid title is required', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    const moduleExists = await db
      .select()
      .from(modules)
      .where(eq(modules.id, parseInt(moduleId)))
      .limit(1);

    if (moduleExists.length === 0) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 }
      );
    }

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const existingLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, parseInt(moduleId)))
        .orderBy(desc(lessons.orderIndex))
        .limit(1);

      if (existingLessons.length > 0 && existingLessons[0].orderIndex !== null) {
        finalOrderIndex = existingLessons[0].orderIndex + 1;
      } else {
        finalOrderIndex = 1;
      }
    }

    const newLesson = await db
      .insert(lessons)
      .values({
        moduleId: parseInt(moduleId),
        title: title.trim(),
        content: content?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        orderIndex: finalOrderIndex,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        freePreview: freePreview || false,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newLesson[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}