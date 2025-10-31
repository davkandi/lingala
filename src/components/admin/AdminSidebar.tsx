"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  MessageSquare,
  CreditCard,
  LogOut,
  Menu,
  X,
  GraduationCap,
  PlayCircle,
  Settings,
  HelpCircle,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

const navSections = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        description: "Analytics overview"
      },
    ]
  },
  {
    title: "Course Creation",
    items: [
      {
        title: "Courses",
        href: "/admin/courses",
        icon: BookOpen,
        description: "Manage all courses"
      },
      {
        title: "Content Library",
        href: "/admin/content",
        icon: FileText,
        description: "Media & materials"
      },
      {
        title: "Media Upload",
        href: "/admin/media",
        icon: Upload,
        description: "Upload files & assets"
      },
    ]
  },
  {
    title: "Student Management",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        description: "Student accounts"
      },
      {
        title: "Messages",
        href: "/admin/messages",
        icon: MessageSquare,
        description: "Student support"
      },
    ]
  },
  {
    title: "Business",
    items: [
      {
        title: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        description: "Revenue & billing"
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        description: "Performance reports"
      },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      
      if (token) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      toast.success("Signed out successfully");
      router.push("/admin/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r shadow-sm transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">A</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">Admin Portal</h2>
                <p className="text-xs text-muted-foreground">Lingala.cd</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {navSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-2">
                <div className="px-3 py-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className={cn(
                          "text-xs leading-tight",
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground/70"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {sectionIndex < navSections.length - 1 && (
                  <div className="h-px bg-border/50 mx-3 my-3" />
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
