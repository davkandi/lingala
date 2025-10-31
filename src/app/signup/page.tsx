"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const errorMessages = useMemo(
    () => ({
      USER_ALREADY_EXISTS: t("auth.errors.userExists"),
      INVALID_EMAIL: t("auth.errors.invalidEmail"),
      WEAK_PASSWORD: t("auth.errors.passwordTooShort"),
    }),
    [t]
  );

  const getErrorMessage = (code: string) => {
    if (code && code in errorMessages) {
      return errorMessages[code as keyof typeof errorMessages];
    }
    return t("auth.errors.generic");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.errors.passwordMismatch"));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t("auth.errors.passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      if (error?.code) {
        toast.error(getErrorMessage(error.code));
        return;
      }

      toast.success(t("auth.toast.signupSuccess"));
      router.push("/login?registered=true");
    } catch (err) {
      toast.error(t("auth.errors.generic"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
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
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              className="flex justify-center mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Logo showText={false} />
            </motion.div>
            <CardTitle className="text-2xl">{t("auth.signup.title")}</CardTitle>
            <CardDescription>{t("auth.signup.subtitle")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.signup.nameLabel")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.placeholders.name")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.signup.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.placeholders.email")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.signup.passwordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.placeholders.password")}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  {t("auth.signup.passwordHelper")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.signup.confirmPasswordLabel")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("auth.placeholders.password")}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.signup.cta.loading")}
                  </>
                ) : (
                  t("auth.signup.cta.primary")
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {t("auth.signup.termsText")}{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  {t("auth.signup.termsLink")}
                </Link>{" "}
                {t("auth.signup.and")}{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  {t("auth.signup.privacyLink")}
                </Link>
              </p>
              <div className="text-center text-sm text-muted-foreground">
                {t("auth.signup.alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t("auth.signup.signIn")}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
