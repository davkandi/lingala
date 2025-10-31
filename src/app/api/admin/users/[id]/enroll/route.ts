import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { user, courses, userEnrollments } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const adminValidation = await validateAdmin(headersList);
    
    if (adminValidation.status !== 200) {
      return NextResponse.json(
        { error: adminValidation.error },
        { status: adminValidation.status }
      );
    }

    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId || isNaN(parseInt(courseId.toString()))) {
      return NextResponse.json(
        { error: 'Valid course ID is required', code: 'INVALID_COURSE_ID' },
        { status: 400 }
      );
    }

    const courseIdNum = parseInt(courseId.toString());

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseIdNum))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const existingEnrollment = await db
      .select()
      .from(userEnrollments)
      .where(
        and(
          eq(userEnrollments.userId, userId),
          eq(userEnrollments.courseId, courseIdNum)
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { error: 'User already enrolled in this course', code: 'ALREADY_ENROLLED' },
        { status: 400 }
      );
    }

    const newEnrollment = await db
      .insert(userEnrollments)
      .values({
        userId: userId,
        courseId: courseIdNum,
        enrolledAt: new Date().toISOString(),
        completedAt: null
      })
      .returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}