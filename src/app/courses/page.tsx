"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, BarChart, CheckCircle, Star, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  language: string;
  sourceLanguage: string;
  thumbnailUrl: string;
  price: number;
  moduleCount: number;
  lessonCount: number;
}

export default function CoursesPage() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setErrorKey(null);

    try {
      const response = await fetch("/api/courses");
      if (!response.ok) {
        throw new Error("FAILED_TO_FETCH_COURSES");
      }
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setErrorKey("courses.errors.load");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = selectedLevel === "all" 
    ? courses 
    : courses.filter(course => course.level === selectedLevel);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "intermediate":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "advanced":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
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

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        {/* Animated Background Blobs */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="container relative py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center space-y-6 max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="text-sm px-4 py-1.5">
                <Star className="w-3 h-3 inline mr-1.5" />
                {t("courses.badge")}
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              {t("courses.title")}
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed"
              variants={itemVariants}
            >
              {t("courses.subtitle")}
            </motion.p>
            
            {/* Stats */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 pt-4"
              variants={itemVariants}
            >
              {[
                { icon: Users, text: t("courses.stats.students") },
                { icon: Award, text: t("courses.stats.instructors") },
                { icon: Star, text: t("courses.stats.rating") },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <stat.icon className={`w-4 h-4 text-primary ${index === 2 ? 'fill-primary' : ''}`} />
                  <span className="text-muted-foreground">{stat.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Level Filter */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {["all", "beginner", "intermediate", "advanced"].map((level) => (
            <Button
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              onClick={() => setSelectedLevel(level)}
              className="capitalize min-w-[110px] shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              {level === "all" ? t("courses.filters.allLevels") : t(`courses.filters.${level}`)}
            </Button>
          ))}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-56 w-full rounded-none" />
                </CardHeader>
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="pt-4">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {errorKey && (
          <motion.div
            className="text-center py-16 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 space-y-4">
              <p className="text-destructive font-medium">{t(errorKey)}</p>
              <Button onClick={fetchCourses} variant="destructive">
                {t("courses.actions.retry")}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Courses Grid */}
        {!loading && !errorKey && (
          <>
            {filteredCourses.length === 0 ? (
              <motion.div
                className="text-center py-16 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-muted/50 rounded-lg p-12 space-y-3">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="text-lg font-medium">{t("courses.noCourses")}</p>
                  <p className="text-muted-foreground text-sm">
                    {t("courses.noCoursesDesc")}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="group flex flex-col overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 h-full">
                      <CardHeader className="p-0 relative">
                        <div className="relative h-56 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 overflow-hidden">
                          <img
                            src={course.thumbnailUrl || `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop`}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                          <Badge 
                            className={`absolute top-4 right-4 capitalize border ${getLevelColor(course.level)} backdrop-blur-sm shadow-lg`}
                          >
                            {t(`courses.filters.${course.level}`)}
                          </Badge>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400" 
                                />
                              ))}
                              <span className="text-xs text-white ml-1.5 font-medium">5.0</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <div className="flex flex-col flex-1 p-6">
                        <CardTitle className="text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3 mb-6 leading-relaxed">
                          {course.description}
                        </CardDescription>
                        
                        <CardContent className="flex-1 p-0 space-y-3 mb-6">
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <span>{course.moduleCount} {t("courses.modules")}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <Clock className="w-4 h-4 text-primary" />
                            </div>
                            <span>{course.lessonCount} {t("courses.lessons")}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <BarChart className="w-4 h-4 text-primary" />
                            </div>
                            <span className="capitalize">{t(`courses.filters.${course.level}`)} {t("courses.level")}</span>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="p-0 flex items-center justify-between gap-4 pt-6 border-t">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-primary">{t("courses.pricingLabel")}</span>
                            <span className="text-xs text-muted-foreground">{t("courses.pricingDescription")}</span>
                          </div>
                          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                            <Link href={`/courses/${course.id}`}>
                              {t("courses.viewCourse")}
                            </Link>
                          </Button>
                        </CardFooter>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 border-y relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <motion.div
            className="text-center mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("courses.benefits.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("courses.benefits.subtitle")}
            </p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {[
              {
                icon: CheckCircle,
                title: t("courses.benefits.lifetimeAccess"),
                description: t("courses.benefits.lifetimeAccessDesc")
              },
              {
                icon: Award,
                title: t("courses.benefits.certificate"),
                description: t("courses.benefits.certificateDesc")
              },
              {
                icon: BookOpen,
                title: t("courses.benefits.videoLessons"),
                description: t("courses.benefits.videoLessonsDesc")
              },
              {
                icon: Star,
                title: t("courses.benefits.resources"),
                description: t("courses.benefits.resourcesDesc")
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm border-border/50 h-full">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
