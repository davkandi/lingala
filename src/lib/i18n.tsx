"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export type Language = "en" | "fr";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

type TranslationDictionary = Record<string, unknown>;

type NamespaceLoaders = Record<
  Language,
  Record<string, () => Promise<TranslationDictionary>>
>;

const defaultLanguage: Language = "en";
const COOKIE_NAME = "lingala_language";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const defaultNamespaces = ["common"];

const staticNamespaceMap: Record<string, string[]> = {
  "/": ["home"],
  "/pricing": ["pricing"],
  "/courses": ["courses"],
  "/about": ["about"],
  "/login": ["auth"],
  "/signup": ["auth"],
  "/dashboard": ["dashboard"],
  "/admin": ["admin"],
};

const dynamicNamespaceResolvers: Array<{
  test: (pathname: string) => boolean;
  namespaces: string[];
}> = [
  {
    test: (pathname) => pathname.startsWith("/courses/"),
    namespaces: ["courseDetail"],
  },
  {
    test: (pathname) => pathname.startsWith("/dashboard/"),
    namespaces: ["dashboard"],
  },
  {
    test: (pathname) => pathname.startsWith("/admin/"),
    namespaces: ["admin"],
  },
];

const localeLoaders: NamespaceLoaders = {
  en: {
    common: () =>
      import("@/locales/en/common.json").then((mod) => mod.default ?? mod),
    home: () =>
      import("@/locales/en/home.json").then((mod) => mod.default ?? mod),
    pricing: () =>
      import("@/locales/en/pricing.json").then((mod) => mod.default ?? mod),
    courses: () =>
      import("@/locales/en/courses.json").then((mod) => mod.default ?? mod),
    courseDetail: () =>
      import("@/locales/en/courseDetail.json").then(
        (mod) => mod.default ?? mod,
      ),
    about: () =>
      import("@/locales/en/about.json").then((mod) => mod.default ?? mod),
    auth: () =>
      import("@/locales/en/auth.json").then((mod) => mod.default ?? mod),
    dashboard: () =>
      import("@/locales/en/dashboard.json").then((mod) => mod.default ?? mod),
    admin: () =>
      import("@/locales/en/admin.json").then((mod) => mod.default ?? mod),
  },
  fr: {
    common: () =>
      import("@/locales/fr/common.json").then((mod) => mod.default ?? mod),
    home: () =>
      import("@/locales/fr/home.json").then((mod) => mod.default ?? mod),
    pricing: () =>
      import("@/locales/fr/pricing.json").then((mod) => mod.default ?? mod),
    courses: () =>
      import("@/locales/fr/courses.json").then((mod) => mod.default ?? mod),
    courseDetail: () =>
      import("@/locales/fr/courseDetail.json").then(
        (mod) => mod.default ?? mod,
      ),
    about: () =>
      import("@/locales/fr/about.json").then((mod) => mod.default ?? mod),
    auth: () =>
      import("@/locales/fr/auth.json").then((mod) => mod.default ?? mod),
    dashboard: () =>
      import("@/locales/fr/dashboard.json").then((mod) => mod.default ?? mod),
    admin: () =>
      import("@/locales/fr/admin.json").then((mod) => mod.default ?? mod),
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function resolveValue(
  dictionary: TranslationDictionary | undefined,
  path: string[],
): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);
}

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const segments = pathname.split("/");
  return segments.length > 1 ? `/${segments[1]}` : "/";
}

function getNamespacesForPath(pathname: string): string[] {
  const namespaces = [...defaultNamespaces];
  const normalized = normalizePathname(pathname);

  if (normalized in staticNamespaceMap) {
    namespaces.push(...staticNamespaceMap[normalized]);
  }

  for (const resolver of dynamicNamespaceResolvers) {
    if (resolver.test(pathname)) {
      namespaces.push(...resolver.namespaces);
    }
  }

  return Array.from(new Set(namespaces));
}

function readLanguageCookie(): Language | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.split("=")[1];
  return value === "en" || value === "fr" ? value : null;
}

function detectNavigatorLanguage(): Language {
  if (typeof navigator === "undefined") {
    return defaultLanguage;
  }

  const lang = navigator.language?.toLowerCase();

  if (lang?.startsWith("fr")) {
    return "fr";
  }

  return defaultLanguage;
}

function persistLanguageChoice(language: Language) {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${language}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("language", language);
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [initialLanguageLoaded, setInitialLanguageLoaded] = useState(false);
  const [translations, setTranslations] = useState<
    Record<Language, Record<string, TranslationDictionary>>
  >({
    en: {},
    fr: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const loadedNamespacesRef = useRef<Record<Language, Set<string>>>({
    en: new Set(),
    fr: new Set(),
  });
  const shouldSyncProfileRef = useRef(false);
  const suppressNextSyncRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cookieLang = readLanguageCookie();
    const storedLang = window.localStorage?.getItem("language") as
      | Language
      | null;
    const initial =
      cookieLang || storedLang || detectNavigatorLanguage() || defaultLanguage;

    setLanguageState(initial);
    persistLanguageChoice(initial);
    setInitialLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (!initialLanguageLoaded) {
      return;
    }

    persistLanguageChoice(language);
  }, [language, initialLanguageLoaded]);

  useEffect(() => {
    if (!initialLanguageLoaded) {
      return;
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language, initialLanguageLoaded]);

  useEffect(() => {
    if (!initialLanguageLoaded) {
      return;
    }

    const canSyncProfile = Boolean(
      session?.user && "preferredLanguage" in session.user,
    );
    if (!canSyncProfile) {
      shouldSyncProfileRef.current = false;
      return;
    }

    if (!session?.user || suppressNextSyncRef.current) {
      suppressNextSyncRef.current = false;
      shouldSyncProfileRef.current = false;
      return;
    }

    if (!shouldSyncProfileRef.current) {
      return;
    }

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("bearer_token")
        : null;
    if (!token) {
      shouldSyncProfileRef.current = false;
      return;
    }

    const controller = new AbortController();

    const syncPreference = async () => {
      try {
        await fetch("/api/user/language", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language }),
          signal: controller.signal,
        });
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error("Failed to sync language preference", error);
        }
      } finally {
        shouldSyncProfileRef.current = false;
      }
    };

    syncPreference();

    return () => {
      controller.abort();
    };
  }, [language, session, initialLanguageLoaded]);

  useEffect(() => {
    if (!initialLanguageLoaded) {
      return;
    }

    const namespaces = getNamespacesForPath(pathname);
    const missingForActive = namespaces.filter(
      (ns) => !loadedNamespacesRef.current[language].has(ns),
    );
    const missingForEnglish = namespaces.filter(
      (ns) => !loadedNamespacesRef.current.en.has(ns),
    );

    if (
      !missingForActive.length &&
      (language === "en" || !missingForEnglish.length)
    ) {
      if (isLoading) {
        setIsLoading(false);
      }
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadForLanguage = async (
      targetLanguage: Language,
      namespacesToLoad: string[],
    ) => {
      if (!namespacesToLoad.length) {
        return;
      }

      const entries: [string, TranslationDictionary][] = [];

      for (const namespace of namespacesToLoad) {
        let data: TranslationDictionary | null = null;

        const loader = localeLoaders[targetLanguage]?.[namespace];
        if (loader) {
          try {
            data = (await loader()) as TranslationDictionary;
          } catch (error) {
            console.error(
              `[i18n] Failed to load ${targetLanguage}/${namespace}`,
              error,
            );
          }
        } else if (targetLanguage !== "en") {
          console.warn(
            `[i18n] Missing locale loader for ${targetLanguage}/${namespace}, falling back to English.`,
          );
        }

        if (!data && targetLanguage !== "en") {
          const fallbackLoader = localeLoaders.en?.[namespace];
          if (fallbackLoader) {
            try {
              data = (await fallbackLoader()) as TranslationDictionary;
            } catch (error) {
              console.error(
                `[i18n] Failed to load fallback en/${namespace}`,
                error,
              );
            }
          }
        }

        entries.push([namespace, data ?? {}]);
      }

      if (cancelled) {
        return;
      }

      setTranslations((prev) => ({
        ...prev,
        [targetLanguage]: {
          ...prev[targetLanguage],
          ...Object.fromEntries(entries),
        },
      }));

      loadedNamespacesRef.current[targetLanguage] = new Set([
        ...Array.from(loadedNamespacesRef.current[targetLanguage]),
        ...namespacesToLoad,
      ]);
    };

    const loadNamespaces = async () => {
      if (missingForEnglish.length) {
        await loadForLanguage("en", missingForEnglish);
      }

      if (missingForActive.length) {
        await loadForLanguage(language, missingForActive);
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    loadNamespaces();

    return () => {
      cancelled = true;
    };
  }, [language, pathname, initialLanguageLoaded, isLoading]);

  const t = useCallback(
    (key: string): string => {
      if (!key) {
        return key;
      }

      const segments = key.split(".");
      if (segments.length < 2) {
        return key;
      }

      const [namespace, ...path] = segments;
      const dictionary = translations[language]?.[namespace];
      const fallbackDictionary = translations.en?.[namespace];

      const value =
        resolveValue(dictionary, path) ??
        resolveValue(fallbackDictionary, path);

      return typeof value === "string" ? value : key;
    },
    [language, translations],
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      if (lang !== "en" && lang !== "fr") {
        return;
      }

      if (lang === language) {
        return;
      }

      shouldSyncProfileRef.current = true;
      suppressNextSyncRef.current = false;
      setLanguageState(lang);
    },
    [language],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, setLanguage, t, isLoading],
  );

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
