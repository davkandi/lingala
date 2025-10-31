"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { BookOpen, Clock, BarChart, CheckCircle2, Play, Lock } from "lucide-react";
import Link from "next/link";
import { PaymentButton } from "@/components/PaymentButton";

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl: string;
  orderIndex: number;
  durationMinutes: number;
}

interface Module {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  language: string;
  thumbnailUrl: string;
  price: number;
  modules: Module[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    if (session?.user) {
      checkEnrollment();
      checkSubscriptionStatus();
    } else {
      setSubscriptionLoading(false);
    }
  }, [params.id, session]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const enrollments = await response.json();
        const enrolled = enrollments.some(
          (e: any) => e.courseId === parseInt(params.id as string)
        );
        setIsEnrolled(enrolled);
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
        
        // Note: Users will be enrolled when they click "Start Course" button
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const autoEnrollSubscriber = async () => {
    try {
      const response = await fetch(`/api/courses/${params.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsEnrolled(true);
        toast.success('Enrolled in course successfully!');
      }
    } catch (error) {
      console.error('Error auto-enrolling subscriber:', error);
    }
  };


  if (loading) {
    return (
      <div className="container py-12">
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Button asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const totalDuration = course.modules.reduce(
    (acc, module) =>
      acc + module.lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0),
    0
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Badge className="capitalize">{course.level}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold">{course.title}</h1>
              <p className="text-xl text-muted-foreground">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{course.modules.length} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{Math.round(totalDuration / 60)} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  <span className="capitalize">{course.level}</span>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <Card className="h-fit sticky top-20">
              <CardHeader>
                <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg overflow-hidden mb-4">
                  <img
                    src={course.thumbnailUrl || `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop`}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {hasActiveSubscription ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">Premium Access</div>
                    <CardDescription>Access with your active subscription</CardDescription>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">$29.99/month</div>
                    <CardDescription>Get access to all courses with premium subscription</CardDescription>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionLoading ? (
                  <Button className="w-full" disabled>
                    Checking access...
                  </Button>
                ) : (
                  <PaymentButton
                    courseId={course.id}
                    courseName={course.title}
                    price="29.99"
                    isEnrolled={isEnrolled || hasActiveSubscription}
                    className="w-full"
                  />
                )}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Premium subscription includes:</h4>
                  {[
                    "Access to all courses",
                    "Certificate of completion",
                    "Downloadable resources", 
                    "Mobile & desktop access",
                    "Assignments and quizzes",
                    "Priority support",
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12 md:py-20 container">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Course Content</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {course.modules
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((module, moduleIndex) => (
                <AccordionItem key={module.id} value={`module-${module.id}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-4 text-left">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{module.lessons.length} lessons</span>
                          <span>
                            {module.lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 mt-4 ml-12">
                      {module.lessons
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isEnrolled ? (
                                <Play className="w-4 h-4 text-primary" />
                              ) : (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="font-medium text-sm">
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lesson.durationMinutes} min
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Master essential Lingala vocabulary and phrases",
              "Understand grammar rules and sentence structure",
              "Practice pronunciation with native speakers",
              "Build confidence in conversation",
              "Learn cultural context and customs",
              "Apply knowledge in real-life situations",
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}