'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  
  const courseId = params.id as string;
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
      return;
    }

    if (session?.user && sessionId) {
      verifyPayment();
    }
  }, [session, sessionId, isPending]);

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token')}`,
        },
        body: JSON.stringify({
          sessionId,
          courseId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus('success');
        setEnrollmentData(data);
      } else {
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setVerificationStatus('error');
    }
  };

  if (isPending || verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your enrollment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. Please contact support if you believe this is an error.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/courses/${courseId}`}>
                  Return to Course
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            </motion.div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <CardDescription className="text-lg">
              Welcome to your new course
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Enrollment Status</span>
                <Badge className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Enrolled
                </Badge>
              </div>
              {enrollmentData?.enrollmentDate && (
                <p className="text-sm text-muted-foreground">
                  Enrolled on: {new Date(enrollmentData.enrollmentDate).toLocaleDateString()}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h3 className="font-semibold">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Access all course materials and videos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Track your progress through lessons
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Download course resources
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Certificate upon completion
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 pt-4"
            >
              <Button asChild className="w-full" size="lg">
                <Link href={`/courses/${courseId}/player`}>
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-4 border-t"
            >
              <p className="text-sm text-muted-foreground">
                Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}