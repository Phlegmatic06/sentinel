"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setMessage("Password reset protocol initiated. Check your email for the secure link.");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden selection:bg-purple-500/30 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[140px]" />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4 z-10">
        <div className="absolute bottom-full left-0 w-full text-center pb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/3 border border-white/8 shadow-[0_0_30px_rgba(124,58,237,0.15)] mb-6">
            <ShieldAlert className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            Reset Access
          </h1>
          <p className="text-slate-400">
            Enter your designated email to request a new secure passcode.
          </p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleReset} className="flex flex-col gap-5">
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

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-sans"
                  placeholder="admin@sentinel.sys"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-3.5 font-semibold tracking-wide transition-all shadow-[0_0_25px_rgba(124,58,237,0.25)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initiating...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
            
            <div className="text-center mt-2">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
