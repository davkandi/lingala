import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, modules } from '@/db/postgres-schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const { courseId, title, description, orderIndex, sourceLanguage } = body;

    if (!courseId) {
      return NextResponse.json({ 
        error: 'Course ID is required',
        code: 'MISSING_COURSE_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Valid title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    const courseExists = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (courseExists.length === 0) {
      return NextResponse.json({ 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    let finalOrderIndex = orderIndex;
    
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const maxOrderResult = await db.select()
        .from(modules)
        .where(eq(modules.courseId, parseInt(courseId)))
        .orderBy(desc(modules.orderIndex))
        .limit(1);

      finalOrderIndex = maxOrderResult.length > 0 && maxOrderResult[0].orderIndex !== null
        ? maxOrderResult[0].orderIndex + 1
        : 1;
    }

    const parentSourceLanguage = courseExists[0].sourceLanguage ?? 'en';
    const normalizedSourceLanguage: "en" | "fr" =
      sourceLanguage === 'fr' ? 'fr' : parentSourceLanguage === 'fr' ? 'fr' : 'en';

    const newModule = await db.insert(modules)
      .values({
        courseId: parseInt(courseId),
        title: title.trim(),
        description: description ? description.trim() : null,
        orderIndex: finalOrderIndex,
        createdAt: new Date(),
        sourceLanguage: normalizedSourceLanguage,
      })
      .returning();

    return NextResponse.json(newModule[0], { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}
