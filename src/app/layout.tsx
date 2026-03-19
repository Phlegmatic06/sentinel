import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
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
        className={`${inter.variable} ${orbitron.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" strategy="beforeInteractive" />
        <div className="bg-grid absolute inset-0"></div>
        <div className="glow-orb glow-orb-1 absolute"></div>
        <div className="glow-orb glow-orb-2 absolute"></div>
        <div className="glow-orb glow-orb-3 absolute"></div>
        
        <header className="fixed top-0 w-full flex items-center justify-between px-6 py-2 border-b border-white/5 bg-black/20 backdrop-blur-xl z-50">
          <Link href="/" id="sentinel-logo-link" className="flex items-center gap-3 cursor-pointer transition-all hover:scale-105">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <span className="text-white font-bold text-sm font-orbitron mt-0.5">S</span>
            </div>
            <h1 className="text-lg font-orbitron font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)] mt-0.5">
              SENTINEL
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide font-inter">
              DASHBOARD
            </a>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col relative w-full overflow-x-hidden pt-14">
          {children}
        </main>

        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-2xl py-5 mt-auto text-center text-sm text-slate-400 shadow-[0_-8px_32px_0_rgba(0,0,0,0.37)] flex flex-col gap-1 items-center justify-center">
          <p className="font-medium tracking-wide">Powered by Sentinel AI Engine</p>
          <p className="font-mono text-xs text-cyan-500/80">Created by Arghyadeep</p>
        </footer>
      </body>
    </html>
  );
}
