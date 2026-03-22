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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium max-w-md">
            <p className="mb-4">{error}</p>
            <div className="mt-4">
              <button 
                onClick={() => router.push('/auth')}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <h1 className="text-2xl font-orbitron font-bold text-white tracking-wider">
              VERIFYING ACCESS...
            </h1>
            <p className="text-slate-400 font-inter">
              Please wait while we establish a secure connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
