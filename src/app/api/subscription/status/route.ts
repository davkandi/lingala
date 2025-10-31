import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { subscriptions } from '@/db/postgres-schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    // 2. Check for active subscription
    const activeSubscription = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);

    const hasActiveSubscription = activeSubscription.length > 0;
    const subscription = hasActiveSubscription ? activeSubscription[0] : null;

    return NextResponse.json({
      hasActiveSubscription,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planType: subscription.planType,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      } : null,
    });

  } catch (error) {
    console.error('Subscription status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}