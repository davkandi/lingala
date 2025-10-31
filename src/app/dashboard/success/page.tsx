'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, BookOpen, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          setSubscriptionVerified(true);
          toast.success('Subscription activated successfully!');
        } else {
          toast.error('Failed to verify subscription');
        }
      } catch (error) {
        console.error('Subscription verification failed:', error);
        toast.error('Subscription verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Verifying your subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Premium!</CardTitle>
          <CardDescription className="text-lg">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Premium Access Activated</h3>
            </div>
            <p className="text-purple-100">
              You now have unlimited access to all courses and premium features!
            </p>
          </div>

          <div className="grid gap-4">
            <h4 className="font-semibold text-lg">What's included in your Premium subscription:</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Access to all Lingala courses</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Premium learning materials and exercises</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Progress tracking and certificates</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Priority customer support</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => router.push('/courses')}
              className="w-full"
              size="lg"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Start Learning Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Questions? Contact us at support@lingala.cd</p>
            <p className="mt-1">
              Manage your subscription anytime in your 
              <Button variant="link" className="p-0 ml-1" onClick={() => router.push('/dashboard/billing')}>
                billing settings
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}