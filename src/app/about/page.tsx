"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Users, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  const values = [
    {
      icon: Target,
      title: t("about.values.mission"),
      description: t("about.values.missionDesc"),
    },
    {
      icon: Heart,
      title: t("about.values.studentFocused"),
      description: t("about.values.studentFocusedDesc"),
    },
    {
      icon: Users,
      title: t("about.values.community"),
      description: t("about.values.communityDesc"),
    },
    {
      icon: Lightbulb,
      title: t("about.values.innovation"),
      description: t("about.values.innovationDesc"),
    },
  ];

  const team = [
    {
      name: "Dr. Alain Mumbere",
      role: "Founder & CEO",
      bio: "Linguist and educator with 15+ years of experience teaching Lingala.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
    {
      name: "Sarah Lumumba",
      role: "Head of Curriculum",
      bio: "Curriculum specialist focused on interactive language learning methodologies.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    },
    {
      name: "Pierre Kabila",
      role: "Lead Instructor",
      bio: "Native Lingala speaker and experienced language instructor.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    },
  ];

  const milestones = [
    { year: "2020", event: "Lingala.cd founded with a vision to make Lingala accessible online" },
    { year: "2021", event: "Launched first 10 courses with over 1,000 students enrolled" },
    { year: "2022", event: "Reached 5,000+ active learners across 50+ countries" },
    { year: "2023", event: "Introduced live classes and earned 50+ 5-star reviews" },
    { year: "2024", event: "10,000+ students and expanding to mobile platforms" },
  ];

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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 relative overflow-hidden">
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
        
        <div className="container relative">
          <motion.div
            className="max-w-3xl mx-auto text-center space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary">{t("about.badge")}</Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-bold"
              variants={itemVariants}
            >
              {t("about.title")}
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              variants={itemVariants}
            >
              {t("about.subtitle")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 md:py-32 container">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.story.title")}</h2>
          </motion.div>
          <motion.div
            className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.p variants={itemVariants}>
              {t("about.story.p1")}
            </motion.p>
            <motion.p variants={itemVariants}>
              {t("about.story.p2")}
            </motion.p>
            <motion.p variants={itemVariants}>
              {t("about.story.p3")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4">{t("about.values.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{t("about.values.title")}</h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="text-center h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                  <CardHeader>
                    <motion.div
                      className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <value.icon className="w-8 h-8 text-primary" />
                    </motion.div>
                    <CardTitle>{value.title}</CardTitle>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 md:py-32 container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">{t("about.team.badge")}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.team.title")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("about.team.subtitle")}
          </p>
        </motion.div>
        <motion.div
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {team.map((member, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                <CardHeader>
                  <motion.img
                    src={member.avatar}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4 ring-4 ring-primary/20"
                    whileHover={{ scale: 1.05 }}
                  />
                  <CardTitle className="text-center">{member.name}</CardTitle>
                  <CardDescription className="text-center text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4">{t("about.timeline.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{t("about.timeline.title")}</h2>
          </motion.div>
          <motion.div
            className="max-w-3xl mx-auto space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                className="flex gap-6 items-start"
                variants={itemVariants}
                whileHover={{ x: 8 }}
              >
                <motion.div
                  className="flex-shrink-0 w-20 text-2xl font-bold text-primary"
                  whileHover={{ scale: 1.1 }}
                >
                  {milestone.year}
                </motion.div>
                <Card className="flex-1 hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">{milestone.event}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}