"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, TrendingUp, Play, Settings } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface CourseProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface Enrollment {
  id: number;
  enrolledAt: string;
  completedAt: string | null;
  course: {
    id: number;
    title: string;
    description: string;
    level: string;
    thumbnailUrl: string;
  };
  lastViewedLesson: {
    lessonId: number;
    lessonTitle: string;
    moduleId: number;
  } | null;
}

interface EnrollmentWithProgress extends Enrollment {
  progress: CourseProgress;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchEnrollments();
    }
  }, [session]);

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Fetch progress for each enrollment using new auth system
        const enrollmentsWithProgress = await Promise.all(
          data.map(async (enrollment: Enrollment) => {
            try {
              const progressResponse = await fetch(`/api/progress/${enrollment.course.id}`);
              
              if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                return {
                  ...enrollment,
                  progress: progressData.stats,
                };
              }
            } catch (error) {
              console.error(`Error fetching progress for course ${enrollment.course.id}:`, error);
            }
            
            return {
              ...enrollment,
              progress: { completed: 0, total: 0, percentage: 0 },
            };
          })
        );
        
        setEnrollments(enrollmentsWithProgress);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (isPending) {
    return (
      <div className="container py-12">
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const activeEnrollments = enrollments.filter(e => !e.completedAt);
  const completedEnrollments = enrollments.filter(e => e.completedAt);
  
  const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + e.progress.completed, 0);
  const overallProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress.percentage, 0) / enrollments.length)
    : 0;

  return (
    <div className="container py-12 space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {session.user.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey and track your progress.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/account">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Link>
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {[
          { icon: BookOpen, label: "Active Courses", value: activeEnrollments.length, color: "text-blue-500" },
          { icon: Award, label: "Completed", value: completedEnrollments.length, color: "text-green-500" },
          { icon: Clock, label: "Lessons Completed", value: totalLessonsCompleted, color: "text-orange-500" },
          { icon: TrendingUp, label: "Overall Progress", value: `${overallProgress}%`, color: "text-purple-500" },
        ].map((stat, index) => (
          <motion.div key={index} variants={itemVariants} whileHover={{ y: -4, scale: 1.02 }}>
            <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.label}</CardDescription>
                  <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Active Courses */}
      {activeEnrollments.length > 0 && (
        <div>
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold">Continue Learning</h2>
          </motion.div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {activeEnrollments.map((enrollment) => (
                <motion.div
                  key={enrollment.id}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-xl transition-all border-2 hover:border-primary/30">
                    <CardHeader>
                      <div className="relative h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 overflow-hidden group">
                        <img
                          src={
                            enrollment.course.thumbnailUrl ||
                            `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop`
                          }
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <Badge className="absolute top-3 right-3 capitalize backdrop-blur-sm">
                          {enrollment.course.level}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{enrollment.course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {enrollment.course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {enrollment.progress.completed} / {enrollment.progress.total} lessons ({enrollment.progress.percentage}%)
                          </span>
                        </div>
                        <Progress value={enrollment.progress.percentage} className="h-2" />
                      </div>
                      {enrollment.lastViewedLesson && (
                        <div className="text-xs text-muted-foreground">
                          Last viewed: {enrollment.lastViewedLesson.lessonTitle}
                        </div>
                      )}
                      <Button className="w-full group" asChild>
                        <Link href={`/courses/${enrollment.course.id}/player`}>
                          <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Continue Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && enrollments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BookOpen className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by enrolling in a course
                </p>
                <Button asChild size="lg">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div>
          <motion.h2
            className="text-2xl font-bold mb-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            Completed Courses
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {completedEnrollments.map((enrollment) => (
              <motion.div
                key={enrollment.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                <Card className="opacity-75 hover:opacity-100 transition-all hover:shadow-lg border-2 hover:border-green-500/30">
                  <CardHeader>
                    <div className="relative h-40 w-full bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={
                          enrollment.course.thumbnailUrl ||
                          `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop`
                        }
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-3 right-3 bg-green-500">
                        <Award className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{enrollment.course.title}</CardTitle>
                    <CardDescription>
                      Completed on {new Date(enrollment.completedAt!).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/courses/${enrollment.course.id}/player`}>Review Course</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}