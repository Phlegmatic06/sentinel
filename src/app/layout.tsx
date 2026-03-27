import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ShellWrapper } from "@/components/ShellWrapper";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="beforeInteractive" />
          <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" strategy="beforeInteractive" />
          {/* Cosmic Ambient Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--orb-color-1)] blur-[120px] animate-pulse opacity-[var(--orb-opacity)]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--orb-color-2)] blur-[120px] animate-pulse opacity-[var(--orb-opacity)]" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[var(--orb-color-3)] blur-[100px] animate-pulse opacity-[var(--orb-opacity)] delay-700" />
          </div>

          <ShellWrapper>
            {children}
          </ShellWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
