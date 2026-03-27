"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard/admin");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage("Account created! Please check your email for the confirmation link.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let errorText = "An error occurred during authentication.";
      if (typeof err === "string") {
        errorText = err;
      } else if (err?.message && err.message !== "{}") {
        errorText = err.message;
      } else if (JSON.stringify(err) === "{}") {
        errorText = "SMTP Connection Failed. Please double-check your Supabase SMTP settings.";
      } else if (err?.error_description) {
        errorText = err.error_description;
      }
      setError(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden selection:bg-purple-500/30">
      
      {/* Page content */}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4 z-10">
        <div className="absolute bottom-full left-0 w-full text-center pb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-[0_0_30px_rgba(124,58,237,0.15)] dark:shadow-[0_0_30px_rgba(124,58,237,0.2)] mb-6">
            <ShieldAlert className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Sentinel Admin
          </h1>
          <p className="text-[var(--text-secondary)] text-base">
            {isLogin ? "Access the central command console." : "Initialize a new command account."}
          </p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            
            {error && (
              <div className="p-4 bg-red-500/8 border border-red-500/15 rounded-xl text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl text-emerald-400 text-sm font-medium">
                {message}
              </div>
            )}

            <div className="space-y-8 mt-4">
              <Input
                id="admin-email-input"
                label="Admin Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  id="password-input"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <a href="/auth/reset-password" className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-3.5 font-semibold tracking-wide transition-all shadow-[0_0_25px_rgba(124,58,237,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
              >
                {isLogin 
                  ? "Need access? Request new admin credentials" 
                  : "Already configured? Return to login"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
