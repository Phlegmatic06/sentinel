"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in hash fragment (e.g. expired OTP links)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const hashError = params.get("error_description");
      if (hashError) {
        setError(hashError.replace(/\+/g, " "));
        return;
      }
    }

    const handleAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/auth/update-password');
      } else if (event === 'SIGNED_IN') {
        router.push('/dashboard/admin');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center p-4 font-sans selection:bg-purple-500/30">
      <div className="text-center">
        {error ? (
          <div className="p-8 glass-panel text-red-400 font-medium max-w-md border-red-500/15 bg-red-500/5">
            <p className="mb-6">{error}</p>
            <div>
              <button 
                onClick={() => router.push('/auth')}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Verifying Access
            </h1>
            <p className="text-slate-400">
              Establishing a secure connection...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
