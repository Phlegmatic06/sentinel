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
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-white flex items-center gap-3 tracking-wider">
            <ShieldAlert className="text-red-500 w-8 h-8" />
            EVIDENCE VAULT
          </h2>
          <p className="text-slate-400 mt-1 font-inter">Audit trail of all detected violations</p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/dashboard/admin"
            className="px-6 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Admin Console
          </Link>
          <Link 
            href="/"
            className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
          >
            Return to Monitor
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-full border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-900/40 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 font-orbitron text-sm text-cyan-400 tracking-wider">
                <th className="py-4 px-6 font-medium">TIMESTAMP</th>
                <th className="py-4 px-6 font-medium">VIOLATION TYPE</th>
                <th className="py-4 px-6 font-medium text-right">EVIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 animate-pulse font-mono">
                    FETCHING AUDIT LOGS...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 font-mono">
                    NO VIOLATIONS DETECTED.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-sm">
                    <td className="py-4 px-6 text-slate-300">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        {log.violation_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {log.image_url ? (
                        <button 
                          onClick={() => setSelectedImage(log.image_url)}
                          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-500/30"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Snapshot
                        </button>
                      ) : (
                        <span className="text-slate-500 italic">No snapshot</span>
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
          <div className="relative max-w-5xl w-full bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
              <h3 className="text-lg font-orbitron font-bold text-cyan-400">EVIDENCE SNAPSHOT</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-1 max-h-[80vh] overflow-auto flex justify-center bg-black/50">
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
