"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "fr";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "fr")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === "string" ? value : key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

const translations = {
  en: {
    nav: {
      courses: "Courses",
      pricing: "Pricing",
      about: "About",
      signIn: "Sign in",
      getStarted: "Get Started",
      dashboard: "Dashboard",
      profile: "Profile",
      signOut: "Sign out",
    },
    home: {
      badge: "Join 10,000+ learners worldwide",
      hero: "Master the",
      heroHighlight: "Lingala Language",
      subtitle: "Learn Lingala online with comprehensive courses, expert native speakers, and interactive lessons. Start your journey today!",
      getStartedFree: "Get Started Free",
      browseCourses: "Browse Courses",
      noCreditCard: "No credit card required",
      cancelAnytime: "Cancel anytime",
      support247: "24/7 Support",
      stats: {
        activeStudents: "Active Students",
        expertInstructors: "Expert Instructors",
        lessonsAvailable: "Lessons Available",
        successRate: "Success Rate",
      },
      features: {
        badge: "Features",
        title: "Why Choose",
        titleHighlight: "Lingala.cd?",
        subtitle: "Everything you need to master the Lingala language in one comprehensive platform.",
        comprehensiveCurriculum: "Comprehensive Curriculum",
        comprehensiveCurriculumDesc: "Structured courses from beginner to advanced levels with proven learning methods.",
        expertInstructors: "Expert Instructors",
        expertInstructorsDesc: "Learn from native speakers and experienced language educators.",
        learnAtYourPace: "Learn at Your Pace",
        learnAtYourPaceDesc: "Access courses 24/7 and study on your own schedule.",
        certificate: "Certificate of Completion",
        certificateDesc: "Earn certificates as you complete courses and demonstrate proficiency.",
        interactiveLessons: "Interactive Lessons",
        interactiveLessonsDesc: "Practice speaking, listening, reading, and writing with interactive exercises.",
        trackProgress: "Track Progress",
        trackProgressDesc: "Monitor your learning journey with detailed progress tracking.",
      },
      testimonials: {
        badge: "Testimonials",
        title: "What Our Students Say",
        subtitle: "Real stories from real learners",
      },
      cta: {
        badge: "Limited Time Offer",
        title: "Ready to Start Your",
        titleHighlight: "Learning Journey?",
        subtitle: "Join thousands of students mastering Lingala. Get started with a free trial and unlock your potential today.",
        startLearning: "Start Learning Now",
        viewAllCourses: "View All Courses",
        freeTrial: "14-day free trial",
        noCommitments: "No commitments",
      },
    },
    courses: {
      badge: "Our Courses",
      title: "Explore Lingala Courses",
      subtitle: "Master Lingala with our expertly designed courses. From complete beginners to advanced learners, we have the perfect path for your language journey.",
      stats: {
        students: "1,000+ Students",
        instructors: "Expert Instructors",
        rating: "4.9 Average Rating",
      },
      filters: {
        allLevels: "All Levels",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
      },
      modules: "modules",
      lessons: "lessons",
      level: "level",
      oneTimePayment: "One-time payment",
      viewCourse: "View Course",
      noCourses: "No courses found",
      noCoursesDesc: "Try selecting a different level to see available courses.",
      benefits: {
        title: "What You'll Get",
        subtitle: "Every course includes everything you need to succeed in your language learning journey.",
        lifetimeAccess: "Lifetime Access",
        lifetimeAccessDesc: "Learn at your own pace with unlimited access to all course materials",
        certificate: "Certificate",
        certificateDesc: "Earn a certificate of completion to showcase your achievement",
        videoLessons: "Video Lessons",
        videoLessonsDesc: "Interactive high-quality video lessons with expert instructors",
        resources: "Resources",
        resourcesDesc: "Downloadable materials, exercises, and practice worksheets",
      },
    },
    about: {
      badge: "About Us",
      title: "Connecting People Through Language",
      subtitle: "Lingala.cd is on a mission to preserve, promote, and teach the beautiful Lingala language to learners worldwide through innovative online education.",
      story: {
        title: "Our Story",
        p1: "Founded in 2020, Lingala.cd was born from a simple observation: millions of people around the world wanted to learn or reconnect with the Lingala language, but quality educational resources were scarce and difficult to access.",
        p2: "Our founder, Dr. Alain Mumbere, a linguist and passionate educator, envisioned a platform where anyone, anywhere could learn Lingala from native speakers using proven pedagogical methods and modern technology.",
        p3: "Today, we're proud to serve over 10,000 active students from more than 50 countries, offering comprehensive courses from beginner to advanced levels. Our mission remains unchanged: to make Lingala accessible to everyone while preserving its rich cultural heritage.",
      },
      values: {
        badge: "Our Values",
        title: "What Drives Us",
        mission: "Mission-Driven",
        missionDesc: "We're committed to preserving and promoting the Lingala language worldwide.",
        studentFocused: "Student-Focused",
        studentFocusedDesc: "Every decision we make is centered around providing the best learning experience.",
        community: "Community",
        communityDesc: "We believe in the power of community to enhance language learning.",
        innovation: "Innovation",
        innovationDesc: "We continuously improve our platform with the latest educational technology.",
      },
      team: {
        badge: "Our Team",
        title: "Meet the Team",
        subtitle: "Passionate educators and language experts dedicated to your success.",
      },
      timeline: {
        badge: "Our Journey",
        title: "Key Milestones",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "Choose Your Learning Plan",
      subtitle: "Start learning for free or upgrade to unlock all features and courses.",
      plans: {
        free: {
          name: "Free",
          description: "Perfect for getting started",
          cta: "Get Started",
        },
        pro: {
          name: "Pro",
          description: "Best for serious learners",
          cta: "Start Pro Trial",
        },
        enterprise: {
          name: "Enterprise",
          description: "For teams and organizations",
          cta: "Contact Sales",
        },
        month: "/month",
        mostPopular: "Most Popular",
      },
      features: {
        accessBeginner: "Access to 3 beginner courses",
        basicMaterials: "Basic learning materials",
        communityForum: "Community forum access",
        progressTracking: "Progress tracking",
        accessAllCourses: "Access to all courses",
        allMaterials: "All learning materials",
        prioritySupport: "Priority support",
        certificates: "Certificates of completion",
        offlineDownloads: "Offline downloads",
        liveQA: "Live Q&A sessions",
        personalDashboard: "Personal progress dashboard",
        everythingPro: "Everything in Pro",
        teamMembers: "Up to 50 team members",
        customPaths: "Custom learning paths",
        accountManager: "Dedicated account manager",
        analytics: "Advanced analytics",
        apiAccess: "API access",
        whiteLabel: "White-label options",
        bulkLicensing: "Bulk licensing discounts",
      },
      faq: {
        title: "Frequently Asked Questions",
        q1: "Can I switch plans later?",
        a1: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
        q2: "What payment methods do you accept?",
        a2: "We accept all major credit cards, PayPal, and bank transfers for enterprise plans.",
        q3: "Is there a refund policy?",
        a3: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your purchase.",
        q4: "Do you offer student discounts?",
        a4: "Yes! Students get 50% off Pro plans. Contact support with valid student ID for the discount code.",
      },
      cta: {
        title: "Still have questions?",
        subtitle: "Our team is here to help. Contact us for more information.",
        contact: "Contact Support",
      },
    },
    footer: {
      description: "Master the Lingala language with our comprehensive online learning platform. Learn at your own pace with expert instructors.",
      platform: "Platform",
      resources: "Resources",
      legal: "Legal",
      courses: "Courses",
      pricing: "Pricing",
      about: "About Us",
      contact: "Contact",
      blog: "Blog",
      help: "Help Center",
      community: "Community",
      faq: "FAQs",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      copyright: "All rights reserved.",
    },
  },
  fr: {
    nav: {
      courses: "Cours",
      pricing: "Tarifs",
      about: "À Propos",
      signIn: "Se connecter",
      getStarted: "Commencer",
      dashboard: "Tableau de bord",
      profile: "Profil",
      signOut: "Se déconnecter",
    },
    home: {
      badge: "Rejoignez plus de 10 000 apprenants dans le monde",
      hero: "Maîtrisez la",
      heroHighlight: "Langue Lingala",
      subtitle: "Apprenez le lingala en ligne avec des cours complets, des locuteurs natifs experts et des leçons interactives. Commencez votre voyage aujourd'hui!",
      getStartedFree: "Commencer Gratuitement",
      browseCourses: "Parcourir les Cours",
      noCreditCard: "Aucune carte bancaire requise",
      cancelAnytime: "Annulez à tout moment",
      support247: "Support 24/7",
      stats: {
        activeStudents: "Étudiants Actifs",
        expertInstructors: "Instructeurs Experts",
        lessonsAvailable: "Leçons Disponibles",
        successRate: "Taux de Réussite",
      },
      features: {
        badge: "Fonctionnalités",
        title: "Pourquoi Choisir",
        titleHighlight: "Lingala.cd?",
        subtitle: "Tout ce dont vous avez besoin pour maîtriser la langue lingala dans une plateforme complète.",
        comprehensiveCurriculum: "Programme Complet",
        comprehensiveCurriculumDesc: "Cours structurés du niveau débutant au niveau avancé avec des méthodes d'apprentissage éprouvées.",
        expertInstructors: "Instructeurs Experts",
        expertInstructorsDesc: "Apprenez auprès de locuteurs natifs et d'éducateurs linguistiques expérimentés.",
        learnAtYourPace: "Apprenez à Votre Rythme",
        learnAtYourPaceDesc: "Accédez aux cours 24h/24 et 7j/7 et étudiez selon votre propre emploi du temps.",
        certificate: "Certificat de Réussite",
        certificateDesc: "Gagnez des certificats en terminant les cours et en démontrant vos compétences.",
        interactiveLessons: "Leçons Interactives",
        interactiveLessonsDesc: "Pratiquez l'expression orale, l'écoute, la lecture et l'écriture avec des exercices interactifs.",
        trackProgress: "Suivez Vos Progrès",
        trackProgressDesc: "Surveillez votre parcours d'apprentissage avec un suivi détaillé des progrès.",
      },
      testimonials: {
        badge: "Témoignages",
        title: "Ce Que Disent Nos Étudiants",
        subtitle: "Histoires réelles d'apprenants réels",
      },
      cta: {
        badge: "Offre à Durée Limitée",
        title: "Prêt à Commencer Votre",
        titleHighlight: "Parcours d'Apprentissage?",
        subtitle: "Rejoignez des milliers d'étudiants qui maîtrisent le lingala. Commencez avec un essai gratuit et libérez votre potentiel dès aujourd'hui.",
        startLearning: "Commencer à Apprendre",
        viewAllCourses: "Voir Tous les Cours",
        freeTrial: "Essai gratuit de 14 jours",
        noCommitments: "Aucun engagement",
      },
    },
    courses: {
      badge: "Nos Cours",
      title: "Explorer les Cours de Lingala",
      subtitle: "Maîtrisez le lingala avec nos cours conçus par des experts. Des débutants complets aux apprenants avancés, nous avons le parcours parfait pour votre voyage linguistique.",
      stats: {
        students: "Plus de 1 000 Étudiants",
        instructors: "Instructeurs Experts",
        rating: "Note Moyenne de 4,9",
      },
      filters: {
        allLevels: "Tous les Niveaux",
        beginner: "Débutant",
        intermediate: "Intermédiaire",
        advanced: "Avancé",
      },
      modules: "modules",
      lessons: "leçons",
      level: "niveau",
      oneTimePayment: "Paiement unique",
      viewCourse: "Voir le Cours",
      noCourses: "Aucun cours trouvé",
      noCoursesDesc: "Essayez de sélectionner un niveau différent pour voir les cours disponibles.",
      benefits: {
        title: "Ce Que Vous Obtiendrez",
        subtitle: "Chaque cours comprend tout ce dont vous avez besoin pour réussir dans votre parcours d'apprentissage linguistique.",
        lifetimeAccess: "Accès à Vie",
        lifetimeAccessDesc: "Apprenez à votre rythme avec un accès illimité à tous les supports de cours",
        certificate: "Certificat",
        certificateDesc: "Gagnez un certificat de réussite pour mettre en valeur votre accomplissement",
        videoLessons: "Leçons Vidéo",
        videoLessonsDesc: "Leçons vidéo interactives de haute qualité avec des instructeurs experts",
        resources: "Ressources",
        resourcesDesc: "Matériaux téléchargeables, exercices et fiches de pratique",
      },
    },
    about: {
      badge: "À Propos",
      title: "Connecter les Gens par le Langage",
      subtitle: "Lingala.cd a pour mission de préserver, promouvoir et enseigner la belle langue lingala aux apprenants du monde entier grâce à une éducation en ligne innovante.",
      story: {
        title: "Notre Histoire",
        p1: "Fondée en 2020, Lingala.cd est née d'une observation simple : des millions de personnes dans le monde souhaitaient apprendre ou se reconnecter avec la langue lingala, mais les ressources éducatives de qualité étaient rares et difficiles d'accès.",
        p2: "Notre fondateur, le Dr Alain Mumbere, linguiste et éducateur passionné, a imaginé une plateforme où n'importe qui, n'importe où, pourrait apprendre le lingala auprès de locuteurs natifs en utilisant des méthodes pédagogiques éprouvées et la technologie moderne.",
        p3: "Aujourd'hui, nous sommes fiers de servir plus de 10 000 étudiants actifs de plus de 50 pays, offrant des cours complets du niveau débutant au niveau avancé. Notre mission reste inchangée : rendre le lingala accessible à tous tout en préservant son riche patrimoine culturel.",
      },
      values: {
        badge: "Nos Valeurs",
        title: "Ce Qui Nous Motive",
        mission: "Axé sur la Mission",
        missionDesc: "Nous nous engageons à préserver et promouvoir la langue lingala dans le monde entier.",
        studentFocused: "Centré sur l'Étudiant",
        studentFocusedDesc: "Chaque décision que nous prenons est centrée sur la fourniture de la meilleure expérience d'apprentissage.",
        community: "Communauté",
        communityDesc: "Nous croyons au pouvoir de la communauté pour améliorer l'apprentissage des langues.",
        innovation: "Innovation",
        innovationDesc: "Nous améliorons continuellement notre plateforme avec les dernières technologies éducatives.",
      },
      team: {
        badge: "Notre Équipe",
        title: "Rencontrez l'Équipe",
        subtitle: "Des éducateurs passionnés et des experts linguistiques dévoués à votre succès.",
      },
      timeline: {
        badge: "Notre Parcours",
        title: "Étapes Clés",
      },
    },
    pricing: {
      badge: "Tarifs",
      title: "Choisissez Votre Plan d'Apprentissage",
      subtitle: "Commencez à apprendre gratuitement ou passez à la version supérieure pour débloquer toutes les fonctionnalités et tous les cours.",
      plans: {
        free: {
          name: "Gratuit",
          description: "Parfait pour commencer",
          cta: "Commencer",
        },
        pro: {
          name: "Pro",
          description: "Idéal pour les apprenants sérieux",
          cta: "Commencer l'Essai Pro",
        },
        enterprise: {
          name: "Enterprise",
          description: "Pour les équipes et les organisations",
          cta: "Contacter les Ventes",
        },
        month: "/mois",
        mostPopular: "Le Plus Populaire",
      },
      features: {
        accessBeginner: "Accès à 3 cours débutants",
        basicMaterials: "Supports d'apprentissage de base",
        communityForum: "Accès au forum communautaire",
        progressTracking: "Suivi des progrès",
        accessAllCourses: "Accès à tous les cours",
        allMaterials: "Tous les supports d'apprentissage",
        prioritySupport: "Support prioritaire",
        certificates: "Certificats de réussite",
        offlineDownloads: "Téléchargements hors ligne",
        liveQA: "Sessions de questions-réponses en direct",
        personalDashboard: "Tableau de bord de progrès personnel",
        everythingPro: "Tout dans Pro",
        teamMembers: "Jusqu'à 50 membres d'équipe",
        customPaths: "Parcours d'apprentissage personnalisés",
        accountManager: "Gestionnaire de compte dédié",
        analytics: "Analyses avancées",
        apiAccess: "Accès API",
        whiteLabel: "Options de marque blanche",
        bulkLicensing: "Remises sur licences groupées",
      },
      faq: {
        title: "Questions Fréquemment Posées",
        q1: "Puis-je changer de plan plus tard?",
        a1: "Oui! Vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les modifications prennent effet immédiatement.",
        q2: "Quels modes de paiement acceptez-vous?",
        a2: "Nous acceptons toutes les principales cartes de crédit, PayPal et les virements bancaires pour les plans d'entreprise.",
        q3: "Y a-t-il une politique de remboursement?",
        a3: "Oui, nous offrons une garantie de remboursement de 30 jours. Si vous n'êtes pas satisfait, nous rembourserons votre achat.",
        q4: "Offrez-vous des réductions pour les étudiants?",
        a4: "Oui! Les étudiants bénéficient de 50% de réduction sur les plans Pro. Contactez le support avec une carte d'étudiant valide pour obtenir le code de réduction.",
      },
      cta: {
        title: "Vous avez encore des questions?",
        subtitle: "Notre équipe est là pour vous aider. Contactez-nous pour plus d'informations.",
        contact: "Contacter le Support",
      },
    },
    footer: {
      description: "Maîtrisez la langue lingala avec notre plateforme d'apprentissage en ligne complète. Apprenez à votre rythme avec des instructeurs experts.",
      platform: "Plateforme",
      resources: "Ressources",
      legal: "Légal",
      courses: "Cours",
      pricing: "Tarifs",
      about: "À Propos",
      contact: "Contact",
      blog: "Blog",
      help: "Centre d'Aide",
      community: "Communauté",
      faq: "FAQ",
      privacy: "Politique de Confidentialité",
      terms: "Conditions d'Utilisation",
      cookies: "Politique des Cookies",
      copyright: "Tous droits réservés.",
    },
  },
};
