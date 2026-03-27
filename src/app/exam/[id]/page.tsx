"use client";

import { useEffect, useState, use, useRef } from "react";
import SentinelEngine, { ViolationType } from "@/components/SentinelEngine";
import { getExamById, submitExamAnswers, Exam } from "@/lib/examService";
import { logSentinelViolation } from "@/lib/supabase";
import { AlertCircle, ShieldCheck, CheckCircle2, Shield, Clock, Camera } from "lucide-react";
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
  const [fullscreenError, setFullscreenError] = useState(false);
  const [isFullScreenTruth, setIsFullScreenTruth] = useState(false);
  const [isBypassActive, setIsBypassActive] = useState(false);
  const [isBrave, setIsBrave] = useState(false);
  const examContainerRef = useRef<HTMLDivElement>(null);

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
      const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
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

  const checkFullscreenTruth = () => {
    const isFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
    
    // Check if the viewport height is actually close to the screen height
    // Threshold set to 60px for all standard browsers
    const gap = Math.abs(window.screen.height - window.innerHeight);
    // If the browser is Brave, we trust its auto-fullscreen state and skip dimension checks
    const truth = isFS && (isDimensionFS || isBypassActive || isBrave);
    setIsFullScreenTruth(truth);
    return truth;
  };

  const startExam = () => {
    setFullscreenError(false);
    const docEl = document.documentElement as any;

    const requestFS = 
      docEl.requestFullscreen || 
      docEl.webkitRequestFullscreen || 
      docEl.webkitRequestFullScreen || 
      docEl.mozRequestFullScreen || 
      docEl.mozRequestFullscreen || 
      docEl.msRequestFullscreen;

    if (requestFS) {
      const fsPromise = requestFS.call(docEl, { navigationUI: "hide" });
      
      if (fsPromise instanceof Promise) {
        fsPromise
          .then(() => {
            // Wait 800ms for browser transition to stabilize
            setTimeout(() => {
              const truth = checkFullscreenTruth();
              if (truth) {
                setSessionActive(true);
                setFullscreenError(false);
              } else {
                setFullscreenError(true);
              }
            }, 800);
          })
          .catch((err) => {
            console.error("Fullscreen error:", err);
            setFullscreenError(true);
          });
      } else {
        setSessionActive(true);
      }
    } else {
      alert("Fullscreen not supported on this browser.");
    }
  };

  useEffect(() => {
    const handleResize = () => checkFullscreenTruth();
    window.addEventListener("resize", handleResize);
    
    // Detect Brave Browser
    const detectBrave = async () => {
      const nav = navigator as any;
      if (nav.brave && await nav.brave.isBrave()) {
        setIsBrave(true);
      }
    };
    detectBrave();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const blurCountRef = useRef(0);

  useEffect(() => {
    if (!sessionActive || submitted) return;

    const handleBlur = () => {
      console.warn("Anti-cheat flag: Window Focus Lost — Zero Tolerance — auto-submitting.");
      logSentinelViolation(`EXAM [${examId}] - ${candidateName}: Window Focus Lost`, null, examId).catch(x => console.error(x));
      submitRef.current();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        console.warn("Anti-cheat flag: Tab Switch Detected — Zero Tolerance — auto-submitting.");
        logSentinelViolation(`EXAM [${examId}] - ${candidateName}: Tab Switch`, null, examId).catch(x => console.error(x));
        submitRef.current();
      }
    };

    const handleFullscreen = () => {
      const doc = document as any;
      const isFS = !!(document.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      const isDimensionFS = Math.abs(window.screen.height - window.innerHeight) < 60;
      
      // If the user used the Brave bypass, we ignore the dimension requirement
      if (!isFS || (!isDimensionFS && !isBypassActive)) {
        console.warn("Anti-cheat flag: Fullscreen Lock Lost — auto-submitting.");
        logSentinelViolation(`EXAM [${examId}] - ${candidateName}: Fullscreen Lock Lost`, null, examId).catch(x => console.error(x));
        submitRef.current();
      }
    };
    
    // Extensive Keyboard Restriction
    const handleKeydown = (e: KeyboardEvent) => {
      if (!sessionActive) return;
      
      const isSystemKey = e.key.startsWith("F") || e.key === "Tab" || e.key === "Escape";
      const isControlCombo = (e.ctrlKey || e.metaKey) && ['p','c','v','x','s','shift','i','u','k','f','l'].includes(e.key.toLowerCase());
      const isAltTab = e.altKey && e.key === "Tab";

      if (isSystemKey || isControlCombo || isAltTab) {
        e.preventDefault();
        e.stopPropagation();
        console.warn(`Blocked shortcut attempt: ${e.key}`);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [sessionActive, submitted, examId, candidateName]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center animate-pulse text-purple-400 font-medium">Loading Exam Data...</div>;
  }

  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl font-bold">Exam not found or invalid link.</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
        <div className="glass-panel p-12 flex flex-col items-center max-w-lg w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-green-400 mb-6 drop-shadow-[0_0_20px_rgba(74,222,128,0.3)]" />
          <h2 className="text-3xl font-bold text-white mb-2">Exam Submitted</h2>
          <p className="text-slate-400 mb-8">Thank you, {candidateName}. Your responses and proctoring feed have been securely collected.</p>
          
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6 w-full mb-8">
            <h3 className="text-slate-500 text-xs font-semibold tracking-wider mb-1">Final Score</h3>
            <p className="text-5xl font-bold text-purple-400">
              {score?.earned} <span className="text-2xl text-slate-500">/ {score?.total}</span>
            </p>
          </div>

          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 font-semibold tracking-wide transition-colors">Return to Home ↗</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={examContainerRef}
      className={`min-h-screen flex-1 flex flex-col relative overflow-hidden bg-[#030014] ${sessionActive ? 'select-none' : ''}`}
      onCopy={(e) => sessionActive && e.preventDefault()}
      onCut={(e) => sessionActive && e.preventDefault()}
      onPaste={(e) => sessionActive && e.preventDefault()}
      onContextMenu={(e) => sessionActive && e.preventDefault()}
      onKeyDown={(e) => {
        if (!sessionActive) return;
        // Block shortcuts like Ctrl+C, Ctrl+V, Ctrl+P, Ctrl+U, F12, etc.
        if (e.ctrlKey || e.metaKey) {
          const forbidden = ['c', 'v', 'p', 'u', 's', 'j', 'i'];
          if (forbidden.includes(e.key.toLowerCase())) {
            e.preventDefault();
            console.warn(`Blocked shortcut: ${e.key}`);
          }
        }
        if (e.key === 'F12') {
          e.preventDefault();
        }
      }}
    >
      {/* Top Banner */}
      <div className="bg-purple-950/20 border-b border-purple-500/15 px-6 py-2.5 flex items-center gap-4 z-40 relative backdrop-blur-md shrink-0">
        <h1 className="text-base font-semibold text-purple-400 tracking-wide flex-1">
          {exam.title}
        </h1>
        {sessionActive && timeLeft !== null && (
          <div className={`px-3 py-1 rounded-md border text-sm font-mono font-bold tracking-widest flex items-center gap-2 ${
            timeLeft < 300 
              ? "bg-red-500/15 border-red-500/30 text-red-400 animate-pulse" 
              : "bg-white/5 border-white/10 text-white"
          }`}>
             {formatTime(timeLeft)}
          </div>
        )}
        {sessionActive && (
          <div className="flex items-center gap-2 text-red-400 font-semibold animate-pulse text-xs">
            <ShieldCheck className="w-4 h-4" /> Secure Proctoring Active
          </div>
        )}
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative z-30">
        
        {/* Left Side: Exam Content */}
        <div className="flex-1 h-full overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/10 pb-32">
          {!sessionActive ? (
            <div className="max-w-xl mx-auto flex flex-col gap-6 mt-12 glass-panel p-8">
              <AlertCircle className="w-14 h-14 text-purple-400 opacity-80" />
              <h2 className="text-2xl font-bold text-white">Ready to Begin?</h2>
              <p className="text-slate-400">
                This exam is strictly proctored by Sentinel AI Engine. Make sure you are in a quiet room, your face is clearly visible, and no prohibited items (phones, books, etc.) are nearby.
              </p>
              
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-xs text-slate-400 tracking-wider font-semibold">Candidate Full Name</label>
                <input 
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Enter your name to verify identity"
                />
              </div>

              {fullscreenError && !isBrave && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-4 mt-4 text-left">
                  <AlertCircle className="w-6 h-6 text-orange-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-orange-400 leading-tight">Screen Dimension Mismatch</p>
                    <p className="text-[10px] font-mono text-orange-300/60 mt-0.5">
                      Viewport: {window.innerHeight}px | Screen: {window.screen.height}px
                    </p>
                    <p className="text-xs text-orange-400/80 leading-relaxed mt-2">
                      Your browser is in Fullscreen but hasn't hidden your tabs/sidebar. Press <strong>F11</strong> to toggle true lockdown.
                    </p>
                  </div>
                </div>
              )}

              <button 
                disabled={!candidateName.trim() || !cameraReady}
                onClick={startExam}
                className="mt-6 w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all"
              >
                {!cameraReady ? "Awaiting Camera Sensor..." : 
                 fullscreenError ? "Re-verify Fullscreen Status" : "Accept & Start Exam"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
              {exam.questions.map((q, idx) => (
                <div key={q.id} className="glass-panel p-6">
                  <div className="flex gap-4">
                    <span className="text-purple-400 font-bold text-lg">{(idx + 1).toString().padStart(2, '0')}.</span>
                    <div className="flex-1">
                      <p className="text-base text-slate-200 mb-4 leading-relaxed">{q.text}</p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/3 relative overflow-hidden group border-white/6">
                            <input 
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                              className="peer w-4 h-4 accent-purple-500 bg-transparent"
                            />
                            <span className="text-slate-300 text-sm peer-checked:text-purple-400 peer-checked:font-semibold transition-all z-10">{opt}</span>
                            {/* Selected background highlight */}
                            <div className="absolute inset-0 bg-purple-500/8 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
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
                  className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all"
                >
                  Final Submit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Proctoring Feed (Always rendered for warmup) */}
        {!submitted && (
          <div className="w-80 h-full border-l border-white/6 bg-black/30 p-4 flex flex-col gap-4 backdrop-blur-xl z-20 shrink-0">
            <h3 className="text-slate-400 text-xs tracking-wider font-medium border-b border-white/6 pb-2">
              {sessionActive ? "Live Proctor Feed" : "System Warmup"}
            </h3>
            
            <div className="w-full relative">
               <SentinelEngine 
                 onViolation={sessionActive ? handleViolation : undefined} 
                 onReady={setCameraReady}
               />
               
               {!sessionActive && (
                 <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 border border-purple-500/20 rounded-xl">
                   <ShieldCheck className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
                   <p className="text-purple-400 font-semibold text-xs tracking-wider">Awaiting Initialization</p>
                 </div>
               )}
            </div>

            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white/2 p-3 rounded-xl border border-white/5">
              <p className="text-purple-400 font-semibold mb-1">System Status: {sessionActive ? "Online" : "Standby"}</p>
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
