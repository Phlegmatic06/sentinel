import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentinel",
  description: "High-Performance AI Exam Proctoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" strategy="beforeInteractive" />
        <div className="glow-orb glow-orb-1 absolute"></div>
        <div className="glow-orb glow-orb-2 absolute"></div>
        <div className="glow-orb glow-orb-3 absolute"></div>
        
        <header className="fixed top-0 w-full flex items-center justify-between px-6 py-3 z-50">
          <Link href="/" id="sentinel-logo-link" className="flex items-center gap-2.5 cursor-pointer transition-all hover:opacity-80 z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              <span className="text-white font-bold text-sm mt-0.5">S</span>
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-white">
              Sentinel
            </h1>
          </Link>

          {/* Pill-shaped glassmorphic nav — dead center */}
          <nav className="hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="px-4 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              Monitor
            </Link>
            <Link href="/dashboard" className="px-4 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              Dashboard
            </Link>
            <Link href="/dashboard/admin" className="px-4 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-3 z-10">
            <a href="/auth" className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              Login
            </a>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col relative w-full h-[100svh] overflow-hidden">
          {children}
        </main>

        <footer className="fixed bottom-0 left-0 w-full border-t border-white/5 py-6 text-center text-sm text-slate-500 flex flex-col gap-1 items-center justify-center z-10 pointer-events-none">
          <p className="font-medium">Powered by Sentinel AI Engine</p>
          <p className="text-xs text-purple-400/60">Created by Arghyadeep</p>
        </footer>
      </body>
    </html>
  );
}
