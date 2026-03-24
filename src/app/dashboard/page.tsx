"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ExternalLink, ShieldAlert, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LogEntry = {
  id: string;
  violation_type: string;
  created_at: string;
  image_url: string | null;
};

export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  useEffect(() => {
    const fetchLogs = async () => {
      // Mock data if Supabase isn't configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder-url.supabase.co") {
        setLogs([
          { id: "1", violation_type: "Cell Phone", created_at: new Date(Date.now() - 5000).toISOString(), image_url: null },
          { id: "2", violation_type: "Presence Lost", created_at: new Date(Date.now() - 60000).toISOString(), image_url: null },
          { id: "3", violation_type: "Gaze Deviation", created_at: new Date(Date.now() - 3600000).toISOString(), image_url: null },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("sentinel_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching logs:", error);
      } else if (data) {
        setLogs(data as LogEntry[]);
      }
      setLoading(false);
    };

    fetchLogs();

    // Setup realtime subscription
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sentinel_logs" },
        (payload) => {
          setLogs((current) => [payload.new as LogEntry, ...current].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex-1 p-8 pt-32 max-w-7xl mx-auto w-full flex flex-col gap-8 h-full relative z-10">
      
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Evidence Vault</h1>
          <p className="text-[var(--text-secondary)]">Secure log of all flagged activities and system violations.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/admin"
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors text-sm font-semibold shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          >
            Admin Console
          </Link>
          <Link 
            href="/"
            className="px-5 py-2 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 transition-colors text-sm font-medium text-slate-300"
          >
            Return to Monitor
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 dark:bg-white/5 border-b border-white/10 dark:border-white/10 text-sm text-purple-600 dark:text-purple-400 tracking-wide">
                <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-widest">Timestamp</th>
                <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-widest">Violation Type</th>
                <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-widest text-right">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 animate-pulse font-mono">
                    Fetching audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">
                    No violations detected.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 dark:border-white/5 hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-[var(--text-primary)] font-medium">#{log.id.slice(0, 8)}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                        {log.violation_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right">
                      {log.image_url ? (
                        <button 
                          onClick={() => setSelectedImage(log.image_url)}
                          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/8 px-3 py-1.5 rounded-md border border-purple-500/15"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Snapshot
                        </button>
                      ) : (
                        <span className="text-slate-500 italic text-xs">No snapshot</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full glass-panel overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/6">
              <h3 className="text-lg font-semibold text-purple-400">Evidence Snapshot</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1.5 hover:bg-white/8 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-2 max-h-[80vh] overflow-auto flex justify-center bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedImage} 
                alt="Violation Evidence" 
                className="max-w-full h-auto rounded-xl border border-white/5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
