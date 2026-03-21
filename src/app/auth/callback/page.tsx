"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // Supabase parses the hash fragment automatically.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      // Check if this is a password recovery flow
      // A common way to check is if there's type=recovery in the URL hash, but supabase handles it by firing PASSWORD_RECOVERY event
      // We can also just listen to the event
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
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium">
            {error}
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
