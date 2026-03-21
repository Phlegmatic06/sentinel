"use client";

import { useEffect, useState, use, useRef } from "react";
import SentinelEngine, { ViolationType } from "@/components/SentinelEngine";
import { getExamById, submitExamAnswers, Exam } from "@/lib/examService";
import { logSentinelViolation } from "@/lib/supabase";
import { AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [answers, setAnswers] = useState<{ [qId: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ earned: number; total: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const e = await getExamById(examId);
      if (e) setExam(e);
      setLoading(false);
    };
    init();
  }, [examId]);

  const handleViolation = async (type: ViolationType, blob: Blob | null) => {
    console.warn(`EXAM PROCTORING: ${type} violation logged for candidate ${candidateName || "unknown"}`);
    await logSentinelViolation(`EXAM [${examId}] - ${candidateName}: ${type}`, blob, examId);
  };

  const calculateScore = () => {
    if (!exam) return 0;
    let earned = 0;
    exam.questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        earned += 1;
      }
    });
    return earned;
  };

  const submitTest = async () => {
    if (!exam) return;
    const earned = calculateScore();
    setScore({ earned, total: exam.questions.length });
    setSubmitted(true);
    setSessionActive(false); // Stop proctoring

    // Exit fullscreen
    try {
      const doc = document as any;
      const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
        if (exitFS) exitFS.call(doc).catch((err: any) => console.warn(err));
      }
    } catch (err) {
      console.warn("Exit fullscreen failed", err);
    }

    await submitExamAnswers({
      exam_id: exam.id,
      candidate_name: candidateName,
      answers,
      score: earned,
      total_questions: exam.questions.length,
    });
  };

  const startExam = async () => {
    try {
      const docEl = document.documentElement as any;
      const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
      
      if (!document.fullscreenElement && !docEl.webkitFullscreenElement && requestFS) {
        await requestFS.call(docEl);
      } else if (!requestFS) {
        return alert("Your browser does not support Fullscreen Mode. Please use a modern browser.");
      }
    } catch (err) {
      console.warn("Fullscreen request failed", err);
      alert("You MUST allow Fullscreen mode to begin this exam. Please check your browser permissions.");
      return; // Block entry
    }
    setSessionActive(true);
  };

  useEffect(() => {
    const logoLink = document.getElementById("sentinel-logo-link");
    if (logoLink) {
      if (sessionActive && !submitted) {
        logoLink.style.pointerEvents = "none";
        logoLink.style.opacity = "0.5";
      } else {
        logoLink.style.pointerEvents = "auto";
        logoLink.style.opacity = "1";
      }
    }
    
    // Cleanup ensuring it restores on unmount
    return () => {
      if (logoLink) {
        logoLink.style.pointerEvents = "auto";
        logoLink.style.opacity = "1";
      }
    };
  }, [sessionActive, submitted]);

  const submitRef = useRef(submitTest);
  useEffect(() => {
    submitRef.current = submitTest;
  });

  // Start countdown
  useEffect(() => {
    if (sessionActive && exam?.duration_minutes && timeLeft === null) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [sessionActive, exam, timeLeft]);

  // Tick countdown
  useEffect(() => {
    if (!sessionActive || submitted || timeLeft === null) return;
    
    if (timeLeft <= 0) {
      console.warn("Time expired! Auto-submitting...");
      submitRef.current();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev! - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [sessionActive, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!sessionActive || submitted) return;

    const enforceFocus = () => {
      console.warn("Anti-cheat flag: Tab Switch/Window Blur.");
      // Fire and forget, don't delay submission!
      logSentinelViolation(`EXAM [${examId}] - ${candidateName}: Window Blur / Tab Switch / Task Manager Opened`, null, examId).catch(e => console.error(e));
      submitRef.current();
    };

    const handleVisibility = () => {
      if (document.hidden) enforceFocus();
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        console.warn("Anti-cheat flag: Exited Fullscreen manually.");
        enforceFocus();
      }
    };
    
    // Extensive Keyboard Restriction
    const handleKeydown = (e: KeyboardEvent) => {
      // Block F1-F12 keys, Ctrl, Alt combinations usually used for DevTools, Print, TaskMgr, etc.
      if (
        e.key.startsWith("F") || 
        (e.ctrlKey && ['p','c','v','x','s','shift','i','u'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("blur", enforceFocus);
    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      window.removeEventListener("blur", enforceFocus);
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [sessionActive, submitted, examId, candidateName]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-orbitron animate-pulse text-cyan-400">Loading Exam Data...</div>;
  }

  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center font-inter text-red-500 text-xl font-bold">Exam not found or invalid link.</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-3xl p-12 flex flex-col items-center max-w-lg w-full text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <CheckCircle2 className="w-24 h-24 text-green-400 mb-6 drop-shadow-[0_0_15px_rgba(7ade80,0.5)]" />
          <h2 className="text-3xl font-orbitron font-bold text-white mb-2">EXAM SUBMITTED</h2>
          <p className="text-slate-400 mb-8 font-inter">Thank you, {candidateName}. Your responses and proctoring feed have been securely collected.</p>
          
          <div className="bg-black/30 border border-white/5 rounded-2xl p-6 w-full mb-8">
            <h3 className="text-slate-500 text-sm font-bold tracking-widest mb-1">FINAL SCORE</h3>
            <p className="text-5xl font-orbitron font-bold text-cyan-400">
              {score?.earned} <span className="text-2xl text-slate-500">/ {score?.total}</span>
            </p>
          </div>

          <Link href="/" className="text-sm text-cyan-500 hover:text-cyan-400 font-bold tracking-wide transition-colors">RETURN TO HOME ↗</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col relative overflow-hidden bg-[#020617] ${sessionActive ? 'select-none' : ''}`}
      onCopy={(e) => sessionActive && e.preventDefault()}
      onCut={(e) => sessionActive && e.preventDefault()}
      onPaste={(e) => sessionActive && e.preventDefault()}
      onContextMenu={(e) => sessionActive && e.preventDefault()}
    >
      {/* Top Banner */}
      <div className="bg-cyan-950/30 border-b border-cyan-500/20 px-6 py-2 flex items-center gap-4 z-40 relative backdrop-blur-md shrink-0">
        <h1 className="text-base font-orbitron font-bold text-cyan-400 tracking-wider flex-1">
          {exam.title}
        </h1>
        {sessionActive && timeLeft !== null && (
          <div className={`px-3 py-1 rounded-md border text-sm font-mono font-bold tracking-widest flex items-center gap-2 ${
            timeLeft < 300 
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" 
              : "bg-white/10 border-white/20 text-white"
          }`}>
             {formatTime(timeLeft)}
          </div>
        )}
        {sessionActive && (
          <div className="flex items-center gap-2 text-red-400 font-bold animate-pulse text-xs">
            <ShieldCheck className="w-4 h-4" /> SECURE PROCTORING ACTIVE
          </div>
        )}
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative z-30">
        
        {/* Left Side: Exam Content */}
        <div className="flex-1 h-full overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 pb-32">
          {!sessionActive ? (
            <div className="max-w-xl mx-auto flex flex-col gap-6 mt-12 bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
              <AlertCircle className="w-16 h-16 text-cyan-400 opacity-80" />
              <h2 className="text-2xl font-orbitron font-bold text-white">READY TO BEGIN?</h2>
              <p className="text-slate-400 font-inter">
                This exam is strictly proctored by Sentinel AI Engine. Make sure you are in a quiet room, your face is clearly visible, and no prohibited items (phones, books, etc.) are nearby.
              </p>
              
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-xs text-slate-400 tracking-widest font-bold">CANDIDATE FULL NAME</label>
                <input 
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Enter your name to verify identity"
                />
              </div>

              <button 
                disabled={!candidateName.trim() || !cameraReady}
                onClick={startExam}
                className="mt-6 w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-orbitron tracking-wider"
              >
                {cameraReady ? "ACCEPT & START EXAM" : "AWAITING CAMERA SENSOR..."}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
              {exam.questions.map((q, idx) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex gap-4">
                    <span className="text-cyan-500 font-orbitron font-bold text-lg">{(idx + 1).toString().padStart(2, '0')}.</span>
                    <div className="flex-1">
                      <p className="text-base text-slate-200 font-inter mb-4 leading-relaxed">{q.text}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 relative overflow-hidden group border-white/10">
                            <input 
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                              className="peer w-4 h-4 accent-cyan-500 bg-transparent"
                            />
                            <span className="text-slate-300 text-sm peer-checked:text-cyan-400 peer-checked:font-bold transition-all z-10">{opt}</span>
                            {/* Selected background highlight pseudo-element */}
                            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={submitTest}
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all font-orbitron"
                >
                  FINAL SUBMIT
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Proctoring Feed (Always rendered for warmup) */}
        {!submitted && (
          <div className="w-80 h-full border-l border-white/10 bg-black/50 p-4 flex flex-col gap-4 backdrop-blur-xl z-20 shrink-0">
            <h3 className="font-orbitron text-slate-400 text-xs tracking-widest border-b border-white/10 pb-2">
              {sessionActive ? "LIVE PROCTOR FEED" : "SYSTEM WARMUP"}
            </h3>
            
            <div className="w-full relative">
               <SentinelEngine 
                 onViolation={sessionActive ? handleViolation : undefined} 
                 onReady={setCameraReady}
               />
               
               {!sessionActive && (
                 <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 border border-cyan-500/30 rounded-xl">
                   <ShieldCheck className="w-8 h-8 text-cyan-400 mb-2 opacity-80" />
                   <p className="text-cyan-400 font-orbitron font-bold text-xs tracking-widest">AWAITING INITIALIZATION</p>
                 </div>
               )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-black/40 p-3 rounded-xl border border-white/5">
              <p className="text-cyan-500 font-bold mb-1">SYSTEM STATUS: {sessionActive ? "ONLINE" : "STANDBY"}</p>
              <ul className="list-disc pl-4 flex flex-col transition-opacity duration-300 opacity-80 gap-0.5">
                <li>Face Mesh Tracking: {sessionActive ? "Active" : "Warming up"}</li>
                <li>Object Classification: {sessionActive ? "Active" : "Warming up"}</li>
                <li>Gaze Vector Analytics: {sessionActive ? "Active" : "Warming up"}</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
