import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { courses } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';

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

    const { courseId, priceId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // 2. Verify course exists and get price
    const course = await db.select()
      .from(courses)
      .where(eq(courses.id, parseInt(courseId)))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const courseData = course[0];
    const priceInCents = Math.round(parseFloat(courseData.price || '0') * 100);

    // 3. Create or retrieve Stripe customer
    let customerId: string;
    
    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // 4. Create Stripe Checkout Session for Monthly Subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Lingala Learning Platform - Monthly Subscription',
              description: 'Full access to all courses and learning materials for one month',
            },
            unit_amount: 2999, // $29.99 per month
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}`,
      metadata: {
        courseId: courseId.toString(),
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planType: 'monthly_premium',
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}