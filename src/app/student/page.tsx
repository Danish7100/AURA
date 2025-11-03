"use client"

import { Header } from "@/app/components/header";
import { StudentDashboard } from "@/app/components/student-dashboard";

export default function StudentPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <StudentDashboard />
      </main>
    </div>
  );
}
