'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  courseId: number;
  courseName: string;
  price: string;
  isEnrolled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  courseId,
  courseName,
  price,
  isEnrolled = false,
  className,
  children
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(data.hasActiveSubscription);
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    checkSubscription();
  }, [session]);

  const handleEnrollment = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    // If user has active subscription, enroll them first, then go to course
    if (hasActiveSubscription && !isEnrolled) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          toast.success('Enrolled in course successfully!');
          router.push(`/courses/${courseId}/player`);
        } else {
          throw new Error('Failed to enroll in course');
        }
      } catch (error) {
        console.error('Enrollment error:', error);
        toast.error('Failed to enroll in course');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If user has active subscription and is enrolled, go to course
    if (hasActiveSubscription && isEnrolled) {
      router.push(`/courses/${courseId}/player`);
      return;
    }

    if (isEnrolled) {
      router.push(`/courses/${courseId}/player`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        body: JSON.stringify({
          courseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start enrollment process');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <Button 
        className={className}
        disabled={true}
        size="lg"
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking access...
      </Button>
    );
  }

  // If user has active subscription, show appropriate button
  if (hasActiveSubscription) {
    return (
      <Button 
        onClick={handleEnrollment}
        className={className}
        disabled={isLoading}
        size="lg"
        variant="default"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Crown className="w-4 h-4 mr-2" />
        )}
        {children || (isEnrolled ? 'Continue Learning' : 'Start Course')}
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button 
        onClick={handleEnrollment}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        {children || 'Continue Learning'}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleEnrollment}
      className={className}
      disabled={isLoading}
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {children || `Get Premium Access - $29.99/month`}
    </Button>
  );
}