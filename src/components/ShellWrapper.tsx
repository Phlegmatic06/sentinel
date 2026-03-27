"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import React from "react";

export function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExamPage = pathname?.startsWith("/exam/");

  if (isExamPage) {
    return (
      <main className="flex-1 flex flex-col relative w-full min-h-screen overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      <header className="fixed top-0 w-full flex items-center justify-between px-6 py-3 z-50">
        <Link href="/" id="sentinel-logo-link" className="flex items-center gap-2.5 cursor-pointer transition-all hover:opacity-80 z-10">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <span className="text-white font-bold text-sm mt-0.5">S</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] transition-colors">
            Sentinel
          </h1>
        </Link>

        {/* Pill-shaped glassmorphic nav — dead center */}
        <nav className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex items-center bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-full px-1.5 py-1.5 backdrop-blur-md shadow-sm">
          <Link href="/" className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-full hover:bg-white/5 dark:hover:bg-white/10 text-center">
            Monitor
          </Link>
          <Link href="/dashboard" className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-full hover:bg-white/5 dark:hover:bg-white/10 text-center">
            Dashboard
          </Link>
          <Link href="/dashboard/admin" className="px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-full hover:bg-white/5 dark:hover:bg-white/10 text-center">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-3 z-10">
          <ThemeToggle />
          <a href="/auth" className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-[0_0_20px_rgba(124,58,237,0.25)]">
            Login
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full h-[100svh] overflow-hidden">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 w-full border-t border-[var(--border-primary)] py-4 text-center items-center justify-center z-50 pointer-events-none bg-[var(--footer-bg)] backdrop-blur-md transition-colors">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] opacity-70">Powered by Sentinel AI Engine</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400/60 font-bold uppercase tracking-tight">Created by Arghyadeep</p>
        </div>
      </footer>
    </div>
  );
}
