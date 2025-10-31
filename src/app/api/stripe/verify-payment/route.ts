import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { userEnrollments } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth.api.getSession({ 
      headers: await headers() 
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId, courseId } = await request.json();

    if (!sessionId || !courseId) {
      return NextResponse.json(
        { error: 'Session ID and Course ID are required' },
        { status: 400 }
      );
    }

    // 2. Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // 3. Verify the session belongs to the current user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 4. Check if user is already enrolled
    const existingEnrollment = await db.select()
      .from(userEnrollments)
      .where(
        and(
          eq(userEnrollments.userId, session.user.id),
          eq(userEnrollments.courseId, parseInt(courseId))
        )
      )
      .limit(1);

    const isEnrolled = existingEnrollment.length > 0;

    return NextResponse.json({
      success: true,
      paymentStatus: checkoutSession.payment_status,
      enrolled: isEnrolled,
      enrollmentDate: isEnrolled ? existingEnrollment[0].enrolledAt : null,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}