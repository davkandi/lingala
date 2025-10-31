"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2,
  UserPlus,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedLessons: number;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  }>;
  recentEnrollments: Array<{
    id: number;
    enrolledAt: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    course: {
      id: number;
      title: string;
      level: string | null;
    };
  }>;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/admin/analytics/overview", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          toast.error("Failed to load analytics");
        }
      } catch (error) {
        toast.error("Error loading analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Courses",
      value: analytics?.totalCourses || 0,
      icon: BookOpen,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Active Enrollments",
      value: analytics?.activeEnrollments || 0,
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Completed Lessons",
      value: analytics?.completedLessons || 0,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading analytics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-2 hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} p-0.5`}>
                  <div className="w-full h-full rounded-lg bg-card flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Recent Users
              </CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentUsers && analytics.recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{user.name || "Unnamed User"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent users</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Recent Enrollments
              </CardTitle>
              <CardDescription>Latest course enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentEnrollments && analytics.recentEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{enrollment.user.name || enrollment.user.email}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.course.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent enrollments</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
