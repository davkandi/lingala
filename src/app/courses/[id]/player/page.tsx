"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Play,
  FileText,
  Download,
  Volume2,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LessonVideoPlayer } from "@/components/LessonVideoPlayer";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  content: string | null;
  videoUrl: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  freePreview: boolean;
  progress: {
    completed: boolean;
    completedAt: string | null;
    lastPositionSeconds: number;
  } | null;
}

interface Module {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  thumbnailUrl: string;
}

interface Material {
  id: number;
  title: string;
  type: string;
  url: string;
}

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progressStats, setProgressStats] = useState({ completed: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (!isPending) {
      fetchCourseStructure();
      if (session?.user) {
        checkEnrollment();
        checkSubscriptionStatus();
      }
    }
  }, [params.id, session, isPending]);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  useEffect(() => {
    if (currentLesson && session?.user) {
      fetchMaterials(currentLesson.id);
    }
  }, [currentLesson, session]);

  useEffect(() => {
    if (session?.user && course) {
      fetchProgressStats();
    }
  }, [session, course]);


  const fetchCourseStructure = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/courses/${params.id}/structure`, { headers });
      if (!response.ok) throw new Error("Failed to fetch course");

      const data = await response.json();
      setCourse(data.course);
      setModules(data.modules);

      // Set first lesson as current
      if (data.modules.length > 0 && data.modules[0].lessons.length > 0) {
        setCurrentLesson(data.modules[0].lessons[0]);
      }
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
        headers: { Authorization: `Bearer ${token}` },
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

  const fetchProgressStats = async () => {
    try {
      const response = await fetch(`/api/progress/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        setProgressStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching progress stats:", error);
    }
  };


  const fetchMaterials = async (lessonId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/materials/${lessonId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      } else {
        setMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    }
  };


  const handleLessonSelect = (lesson: Lesson) => {
    // Check if lesson is accessible
    if (!lesson.freePreview && !isEnrolled && !hasActiveSubscription && !session?.user) {
      toast.error("Please sign in and get premium access to view this lesson");
      return;
    }
    
    if (!lesson.freePreview && !isEnrolled && !hasActiveSubscription) {
      toast.error("Please get premium access to view this lesson");
      return;
    }

    setCurrentLesson(lesson);
  };

  const getNextLesson = () => {
    if (!currentLesson) return null;

    const allLessons = modules.flatMap((m) => m.lessons).sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        const moduleA = modules.find((m) => m.id === a.moduleId);
        const moduleB = modules.find((m) => m.id === b.moduleId);
        return (moduleA?.orderIndex || 0) - (moduleB?.orderIndex || 0);
      }
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    if (!currentLesson) return null;

    const allLessons = modules.flatMap((m) => m.lessons).sort((a, b) => {
      if (a.moduleId !== b.moduleId) {
        const moduleA = modules.find((m) => m.id === a.moduleId);
        const moduleB = modules.find((m) => m.id === b.moduleId);
        return (moduleA?.orderIndex || 0) - (moduleB?.orderIndex || 0);
      }
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };

  const isLessonAccessible = (lesson: Lesson) => {
    return lesson.freePreview || isEnrolled || hasActiveSubscription;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-full max-w-6xl h-[600px]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="font-bold text-lg line-clamp-1">{course.title}</h1>
              {session?.user && isEnrolled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{progressStats.completed} / {progressStats.total} lessons</span>
                  <span>•</span>
                  <span>{progressStats.percentage}% complete</span>
                </div>
              )}
            </div>
          </div>
          {!isEnrolled && !hasActiveSubscription && !isPending && (
            <Button asChild>
              <Link href={`/courses/${params.id}`}>Get Premium Access</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-80 border-r bg-card flex-shrink-0 fixed lg:sticky top-16 h-[calc(100vh-4rem)] z-30 lg:z-0"
            >
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Course Content
                    </h2>
                    {session?.user && (isEnrolled || hasActiveSubscription) && (
                      <Progress value={progressStats.percentage} className="w-20 h-2" />
                    )}
                  </div>

                  {modules
                    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                    .map((module, moduleIndex) => (
                      <div key={module.id} className="space-y-1">
                        <div className="font-medium text-sm py-2">
                          {moduleIndex + 1}. {module.title}
                        </div>
                        {module.lessons
                          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                          .map((lesson, lessonIndex) => {
                            const accessible = isLessonAccessible(lesson);
                            const isActive = currentLesson?.id === lesson.id;

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonSelect(lesson)}
                                disabled={!accessible}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : accessible
                                    ? "hover:bg-muted"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
                                    {lesson.progress?.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : accessible ? (
                                      <Play className="w-4 h-4" />
                                    ) : (
                                      <Lock className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="line-clamp-2">
                                      {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                    </div>
                                    <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                                      {lesson.durationMinutes && <span>{lesson.durationMinutes} min</span>}
                                      {lesson.freePreview && (
                                        <Badge variant="secondary" className="text-xs py-0">
                                          Free
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? "lg:ml-0" : ""}`}>
          <div className="container max-w-5xl py-8 space-y-8">
            {/* Video Player */}
            {currentLesson && (
              <LessonVideoPlayer
                lessonId={currentLesson.id}
                title={currentLesson.title}
                description={currentLesson.content || undefined}
                onComplete={() => {
                  fetchCourseStructure();
                  fetchProgressStats();
                }}
              />
            )}

            {/* Navigation */}
            {currentLesson && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => previousLesson && handleLessonSelect(previousLesson)}
                      disabled={!previousLesson}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous Lesson
                    </Button>
                    <Button
                      onClick={() => nextLesson && handleLessonSelect(nextLesson)}
                      disabled={!nextLesson}
                    >
                      Next Lesson
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resources Section */}
            {materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Resources</CardTitle>
                  <CardDescription>
                    Download materials and practice exercises for this lesson
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {materials.map((material) => (
                      <a
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {material.type === "pdf" && (
                            <FileText className="w-5 h-5 text-red-500" />
                          )}
                          {material.type === "audio" && (
                            <Volume2 className="w-5 h-5 text-blue-500" />
                          )}
                          {material.type === "video" && (
                            <Play className="w-5 h-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {material.type}
                            </p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
