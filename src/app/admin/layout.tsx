"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Don't apply layout to login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Skip authentication check for login page
    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAdmin(true);
          setIsChecking(false);
        } else {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          setIsAdmin(false);
          setIsChecking(false);
          router.push("/admin/login");
        }
      } catch (error) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setIsAdmin(false);
        setIsChecking(false);
        router.push("/admin/login");
      }
    };

    checkAdminAccess();
  }, [router, isLoginPage]);

  // For login page, render without layout
  if (isLoginPage) {
    return children;
  }

  if (isChecking || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen bg-muted/10">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}