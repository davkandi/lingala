"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant={language === "en" ? "default" : "ghost"}
          size="sm"
          onClick={() => setLanguage("en")}
          className="h-8 px-3 gap-2"
        >
          <span className="text-lg">🇺🇸</span>
          <span className="text-xs font-medium">EN</span>
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant={language === "fr" ? "default" : "ghost"}
          size="sm"
          onClick={() => setLanguage("fr")}
          className="h-8 px-3 gap-2"
        >
          <span className="text-lg">🇫🇷</span>
          <span className="text-xs font-medium">FR</span>
        </Button>
      </motion.div>
    </div>
  );
}
