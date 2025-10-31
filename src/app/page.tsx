"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award, Clock, CheckCircle2, TrendingUp, Globe, MessageCircle, Star, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

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

  const testimonialCards = [
    {
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      nameKey: "home.testimonials.items.marie.name",
      roleKey: "home.testimonials.items.marie.role",
      contentKey: "home.testimonials.items.marie.content",
      rating: 5,
    },
    {
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      nameKey: "home.testimonials.items.jeanPaul.name",
      roleKey: "home.testimonials.items.jeanPaul.role",
      contentKey: "home.testimonials.items.jeanPaul.content",
      rating: 5,
    },
    {
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      nameKey: "home.testimonials.items.grace.name",
      roleKey: "home.testimonials.items.grace.role",
      contentKey: "home.testimonials.items.grace.content",
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        {/* Decorative Elements */}
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

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("home.badge")}
                </Badge>
              </motion.div>
              
              <motion.h1
                className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
                variants={itemVariants}
              >
                {t("home.hero")}{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
                  {t("home.heroHighlight")}
                </span>
              </motion.h1>
              
              <motion.p
                className="text-xl md:text-2xl text-muted-foreground leading-relaxed"
                variants={itemVariants}
              >
                {t("home.subtitle")}
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                variants={itemVariants}
              >
                <Button size="lg" asChild className="text-lg px-8 h-14 group">
                  <Link href="/signup">
                    {t("home.getStartedFree")}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14">
                  <Link href="/courses">{t("home.browseCourses")}</Link>
                </Button>
              </motion.div>
              
              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground"
                variants={itemVariants}
              >
                {[
                  { icon: CheckCircle2, text: t("home.noCreditCard") },
                  { icon: CheckCircle2, text: t("home.cancelAnytime") },
                  { icon: CheckCircle2, text: t("home.support247") },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
                <img
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/3cc74cdd-742a-4783-b69d-82d3707e4a9a/generated_images/modern-educational-hero-image-showing-di-06bc65ba-20251025144256.jpg"
                  alt={t("home.images.heroAlt")}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {/* Floating Stats Badge */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-card border-2 border-primary/20 rounded-xl p-4 shadow-xl"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">10,000+</div>
                    <div className="text-xs text-muted-foreground">{t("home.stats.activeStudents")}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-muted/50 to-background border-y relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {[
              { icon: Users, value: "10,000+", label: t("home.stats.activeStudents") },
              { icon: Award, value: "50+", label: t("home.stats.expertInstructors") },
              { icon: BookOpen, value: "100+", label: t("home.stats.lessonsAvailable") },
              { icon: TrendingUp, value: "95%", label: t("home.stats.successRate") },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="mb-3 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section - Image Removed */}
      <section className="py-20 md:py-32 relative">
        <div className="container">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="text-sm">{t("home.features.badge")}</Badge>
            <h2 className="text-4xl md:text-6xl font-bold">
              {t("home.features.title")}{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {t("home.features.titleHighlight")}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.features.subtitle")}
            </p>
          </motion.div>
          
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {[
              {
                icon: BookOpen,
                title: t("home.features.comprehensiveCurriculum"),
                description: t("home.features.comprehensiveCurriculumDesc"),
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Users,
                title: t("home.features.expertInstructors"),
                description: t("home.features.expertInstructorsDesc"),
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Clock,
                title: t("home.features.learnAtYourPace"),
                description: t("home.features.learnAtYourPaceDesc"),
                color: "from-orange-500 to-red-500",
              },
              {
                icon: Award,
                title: t("home.features.certificate"),
                description: t("home.features.certificateDesc"),
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: MessageCircle,
                title: t("home.features.interactiveLessons"),
                description: t("home.features.interactiveLessonsDesc"),
                color: "from-indigo-500 to-blue-500",
              },
              {
                icon: TrendingUp,
                title: t("home.features.trackProgress"),
                description: t("home.features.trackProgressDesc"),
                color: "from-yellow-500 to-orange-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 h-full hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full rounded-xl bg-card flex items-center justify-center">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section with Image */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="text-sm">{t("home.testimonials.badge")}</Badge>
            <h2 className="text-4xl md:text-6xl font-bold">
              {t("home.testimonials.title")}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t("home.testimonials.subtitle")}
            </p>
          </motion.div>

          {/* Success Story Image */}
          <motion.div
            className="mb-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/10">
              <img
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/3cc74cdd-742a-4783-b69d-82d3707e4a9a/generated_images/illustration-of-online-education-success-e30fd9d5-20251025144256.jpg"
                alt={t("home.images.successAlt")}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
          
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {testimonialCards.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <img
                          src={testimonial.avatar}
                          alt={t(testimonial.nameKey)}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{t(testimonial.nameKey)}</CardTitle>
                        <CardDescription>{t(testimonial.roleKey)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      "{t(testimonial.contentKey)}"
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <CardContent className="p-12 md:p-16 text-center space-y-8 relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"
                />
                
                <Badge variant="secondary" className="text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("home.cta.badge")}
                </Badge>
                
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  {t("home.cta.title")}{" "}
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {t("home.cta.titleHighlight")}
                  </span>
                </h2>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {t("home.cta.subtitle")}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="text-lg px-8 h-14 group">
                    <Link href="/signup">
                      {t("home.cta.startLearning")}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14">
                    <Link href="/courses">{t("home.cta.viewAllCourses")}</Link>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{t("home.cta.freeTrial")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{t("home.cta.noCommitments")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
