import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { lessons, lessonMaterials } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ 
        error: validation.error,
        code: validation.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
      }, { status: validation.status });
    }

    const body = await request.json();
    const { lessonId, title, type, url } = body;

    if (!lessonId) {
      return NextResponse.json({ 
        error: 'Lesson ID is required',
        code: 'MISSING_LESSON_ID'
      }, { status: 400 });
    }

    if (isNaN(parseInt(lessonId.toString()))) {
      return NextResponse.json({ 
        error: 'Invalid lesson ID format',
        code: 'INVALID_LESSON_ID'
      }, { status: 400 });
    }

    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId.toString())))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ 
        error: 'Lesson not found',
        code: 'LESSON_NOT_FOUND'
      }, { status: 404 });
    }

    const newMaterial = await db.insert(lessonMaterials)
      .values({
        lessonId: parseInt(lessonId.toString()),
        title: title?.trim() || null,
        type: type?.trim() || null,
        url: url?.trim() || null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newMaterial[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}