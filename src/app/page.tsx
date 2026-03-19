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
    <div className="flex flex-col flex-1 w-full items-center justify-center p-6 gap-8">
      {!sessionActive ? (
        <div className="flex flex-col items-center max-w-lg text-center gap-6">
          <ShieldAlert className="w-20 h-20 text-cyan-400 opacity-80" />
          <h2 className="text-3xl font-orbitron font-bold text-slate-100">
            PROCTORING READY
          </h2>
          <p className="text-slate-400 leading-relaxed font-inter">
            Your environment will be monitored securely by the Sentinel AI Engine. 
            Ensure your face remains in frame and your workspace is clear of prohibited devices.
          </p>
          <button 
            onClick={() => setSessionActive(true)}
            className="mt-4 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 border border-cyan-400/50"
          >
            START SECURE SESSION
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-3 text-cyan-400 bg-cyan-950/30 px-6 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] font-orbitron">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="tracking-widest">LIVE MONITORING ACTIVE</span>
          </div>

          <SentinelEngine onViolation={handleViolation} />
          
          <div className="w-full max-w-4xl bg-black/40 border border-cyan-500/20 p-6 rounded-2xl backdrop-blur-3xl h-48 overflow-y-auto font-mono text-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <h3 className="text-cyan-400 font-orbitron font-bold mb-4 border-b border-cyan-500/20 pb-2 tracking-widest">SYSTEM AUDIT TRAIL</h3>
            {lastViolation ? (
              <div className="text-red-400 animate-pulse bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg flex items-center gap-3">
                <span className="font-bold">[{lastViolation.time.toLocaleTimeString()}]</span> 
                CRITICAL LOG: {lastViolation.type} detected. Snapshot captured and queued for evidence vault.
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
