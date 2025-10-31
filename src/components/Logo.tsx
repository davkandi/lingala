import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
        <GraduationCap className="w-6 h-6 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Lingala.cd
        </span>
      )}
    </Link>
  );
}
