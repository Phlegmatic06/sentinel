"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setIsAuthenticated(false);
        router.push("/auth");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          router.push("/auth");
        } else if (session) {
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-500/30">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white tracking-tight animate-pulse">
          Verifying Credentials
        </h2>
        <p className="text-slate-400 mt-2">Checking secure terminal session...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null; // Redirecting...
  }

  return <>{children}</>;
}
