"use client";

import { useEffect, useState, useCallback } from "react";
import SentinelEngine, { ViolationType } from "@/components/SentinelEngine";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { logSentinelViolation } from "@/lib/supabase";

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false);
  const [lastViolation, setLastViolation] = useState<{type: ViolationType, time: Date} | null>(null);

  useEffect(() => {
    if (sessionActive) {
      document.title = "Sentinel | Live Monitoring";
    } else {
      document.title = "Sentinel";
    }
  }, [sessionActive]);

  const handleViolation = useCallback(async (type: ViolationType, blob: Blob | null) => {
    console.log("Violation detected:", type, blob);
    setLastViolation({ type, time: new Date() });
    await logSentinelViolation(`${type} (Home Monitor)`, blob);
  }, []);

  return (
    <div className="flex flex-col flex-1 w-full items-center justify-center p-8 gap-10 h-full">
      {!sessionActive ? (
        <div className="flex flex-col items-center max-w-lg text-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.15)]">
            <ShieldAlert className="w-10 h-10 text-purple-400" />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">
              Proctoring Ready
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg">
              Your environment will be monitored securely by the Sentinel AI Engine. 
              Ensure your face remains in frame and your workspace is clear of prohibited devices.
            </p>
          </div>
          <button 
            onClick={() => setSessionActive(true)}
            className="mt-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:scale-[1.02]"
          >
            Start Secure Session
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-3 text-purple-400 bg-purple-500/10 px-6 py-2.5 rounded-full border border-purple-500/20 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="tracking-wide text-sm font-medium">Live Monitoring Active</span>
          </div>

          <SentinelEngine onViolation={handleViolation} />
          
          <div className="w-full max-w-4xl glass-panel p-6 h-48 overflow-y-auto font-mono text-sm">
            <h3 className="text-purple-400 font-semibold mb-4 border-b border-white/5 pb-2 tracking-wide text-sm">System Audit Trail</h3>
            {lastViolation ? (
              <div className="text-red-400 animate-pulse bg-red-500/10 border border-red-500/15 px-4 py-3 rounded-lg flex items-center gap-3">
                <span className="font-bold">[{lastViolation.time.toLocaleTimeString()}]</span> 
                CRITICAL: {lastViolation.type} detected. Snapshot captured.
              </div>
            ) : (
              <div className="text-slate-500 italic px-2">
                Awaiting violations... Connection to AI stream stable.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
