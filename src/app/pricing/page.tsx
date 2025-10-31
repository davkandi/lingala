"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function PricingPage() {
  const { t } = useI18n();

  const plans = [
    {
      id: "free",
      name: t("pricing.plans.free.name"),
      price: 0,
      description: t("pricing.plans.free.description"),
      features: [
        t("pricing.features.accessBeginner"),
        t("pricing.features.basicMaterials"),
        t("pricing.features.communityForum"),
        t("pricing.features.progressTracking"),
      ],
      cta: t("pricing.plans.free.cta"),
      href: "/signup",
      popular: false,
    },
    {
      id: "pro",
      name: t("pricing.plans.pro.name"),
      price: 29,
      description: t("pricing.plans.pro.description"),
      features: [
        t("pricing.features.accessAllCourses"),
        t("pricing.features.allMaterials"),
        t("pricing.features.prioritySupport"),
        t("pricing.features.certificates"),
        t("pricing.features.offlineDownloads"),
        t("pricing.features.liveQA"),
        t("pricing.features.personalDashboard"),
      ],
      cta: t("pricing.plans.pro.cta"),
      href: "/signup?plan=pro",
      popular: true,
    },
    {
      id: "enterprise",
      name: t("pricing.plans.enterprise.name"),
      price: 99,
      description: t("pricing.plans.enterprise.description"),
      features: [
        t("pricing.features.everythingPro"),
        t("pricing.features.teamMembers"),
        t("pricing.features.customPaths"),
        t("pricing.features.accountManager"),
        t("pricing.features.analytics"),
        t("pricing.features.apiAccess"),
        t("pricing.features.whiteLabel"),
        t("pricing.features.bulkLicensing"),
      ],
      cta: t("pricing.plans.enterprise.cta"),
      href: "/contact",
      popular: false,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
    <div className="container py-12 md:py-20">
      {/* Header */}
      <motion.div
        className="text-center space-y-4 mb-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="w-3 h-3 mr-1.5" />
            {t("pricing.badge")}
          </Badge>
        </motion.div>
        <motion.h1
          className="text-4xl md:text-5xl font-bold"
          variants={itemVariants}
        >
          {t("pricing.title")}
        </motion.h1>
        <motion.p
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          variants={itemVariants}
        >
          {t("pricing.subtitle")}
        </motion.p>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            variants={itemVariants}
            whileHover={{ y: -8, scale: plan.popular ? 1.02 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`flex flex-col h-full ${
                plan.popular
                  ? "border-primary border-2 shadow-xl shadow-primary/10 relative overflow-hidden"
                  : "hover:shadow-lg hover:border-primary/30 transition-all"
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5" />
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </>
              )}
              <CardHeader className="relative">
                {plan.popular && (
                  <Badge className="w-fit mb-2">{t("pricing.plans.mostPopular")}</Badge>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">{t("pricing.plans.month")}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 relative">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="relative">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-4">{t("pricing.faq.title")}</h2>
        </motion.div>
        <motion.div
          className="space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {[
            {
              question: t("pricing.faq.q1"),
              answer: t("pricing.faq.a1"),
            },
            {
              question: t("pricing.faq.q2"),
              answer: t("pricing.faq.a2"),
            },
            {
              question: t("pricing.faq.q3"),
              answer: t("pricing.faq.a3"),
            },
            {
              question: t("pricing.faq.q4"),
              answer: t("pricing.faq.a4"),
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ x: 4 }}
            >
              <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div
        className="mt-20 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
          <motion.div
            className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <CardContent className="p-12 space-y-4 relative">
            <h2 className="text-3xl font-bold">{t("pricing.cta.title")}</h2>
            <p className="text-muted-foreground">
              {t("pricing.cta.subtitle")}
            </p>
            <Button size="lg" asChild>
              <Link href="/contact">{t("pricing.cta.contact")}</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}