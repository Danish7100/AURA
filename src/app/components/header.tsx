'use client';
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="flex w-full flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              QRCode Attendance
            </h1>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/" className={cn("text-muted-foreground transition-colors hover:text-foreground", pathname === "/" && "text-primary font-semibold")}>
                Teacher
            </Link>
            <Link href="/student" className={cn("text-muted-foreground transition-colors hover:text-foreground", pathname === "/student" && "text-primary font-semibold")}>
                Student
            </Link>
        </div>
      </nav>
    </header>
  );
}
