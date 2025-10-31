import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userEnrollments, courses, subscriptions } from '@/db/postgres-schema';
import { eq, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Validate courseId
    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Valid course ID is required' },
        { status: 400 }
      );
    }

    const parsedCourseId = parseInt(courseId);

    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if course exists
    const courseExists = await db.select()
      .from(courses)
      .where(eq(courses.id, parsedCourseId))
      .limit(1);

    if (courseExists.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has active subscription
    const activeSubscription = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);

    if (activeSubscription.length === 0) {
      return NextResponse.json(
        { error: 'Active subscription required to enroll in courses' },
        { status: 403 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.select()
      .from(userEnrollments)
      .where(
        and(
          eq(userEnrollments.userId, userId),
          eq(userEnrollments.courseId, parsedCourseId)
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { message: 'Already enrolled in this course' },
        { status: 200 }
      );
    }

    // Create enrollment
    const enrollment = await db.insert(userEnrollments).values({
      userId,
      courseId: parsedCourseId,
      enrolledAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: 'Successfully enrolled in course',
      enrollment: enrollment[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Course enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}