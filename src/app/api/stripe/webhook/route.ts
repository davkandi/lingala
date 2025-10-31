import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { userEnrollments, payments, subscriptions } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case 'customer.subscription.created':
        const createdSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(createdSubscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId } = session.metadata || {};

    if (!userId) {
      console.error('Missing userId in checkout session:', session.id);
      return;
    }

    // For subscription mode, the subscription is created separately
    // Just record the payment for now
    if (session.mode === 'subscription' && session.subscription) {
      await db.insert(payments).values({
        userId: userId,
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription as string,
        amount: ((session.amount_total || 0) / 100).toString(),
        currency: session.currency || 'usd',
        status: 'succeeded',
        description: 'Monthly subscription payment',
      });
      
      console.log(`Subscription checkout completed for user ${userId}`);
    }
    
  } catch (error) {
    console.error('Failed to handle checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment status if needed
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    
    // Additional payment processing logic can go here
    
  } catch (error) {
    console.error('Failed to handle payment intent succeeded:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const customerEmail = (customer as Stripe.Customer).email;

    // Create subscription record
    await db.insert(subscriptions).values({
      userId: userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      planType: subscription.metadata?.planType || 'monthly_premium',
    });

    console.log(`Subscription created for user ${userId}: ${subscription.id}`);
    
  } catch (error) {
    console.error('Failed to handle subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    // Update subscription record
    await db.update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log(`Subscription updated for user ${userId}: ${subscription.id}`);
    
  } catch (error) {
    console.error('Failed to handle subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    // Update subscription status to canceled
    await db.update(subscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log(`Subscription canceled for user ${userId}: ${subscription.id}`);
    
  } catch (error) {
    console.error('Failed to handle subscription deleted:', error);
  }
}