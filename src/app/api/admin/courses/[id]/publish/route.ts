import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { courses } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);

    const { id } = await params;
    const courseId = id;

    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentPublishedStatus = existingCourse[0].isPublished;
    const newPublishedStatus = !currentPublishedStatus;

    const updatedCourse = await db
      .update(courses)
      .set({
        isPublished: newPublishedStatus,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, parseInt(courseId)))
      .returning();

    const statusMessage = newPublishedStatus 
      ? 'Course published successfully' 
      : 'Course unpublished successfully';

    return NextResponse.json({
      message: statusMessage,
      course: updatedCourse[0],
    });
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