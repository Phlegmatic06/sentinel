"use client";

import { useState } from "react";
import { uploadExam } from "@/lib/examService";
import { ShieldCheck, BrainCircuit, PenTool, PlusCircle, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type QuestionDraft = {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
};

export default function ExamBuilderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"MANUAL" | "AI">("MANUAL");
  
  // Exam Outline State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  
  // AI Generator State
  const [aiSourceText, setAiSourceText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // -- Manual Builders --
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        text: "",
        options: ["", "", "", ""],
        correct_answer: "",
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateOption = (qId: string, optIdx: number, val: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const setCorrectOption = (qId: string, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correct_answer: val } : q));
  };

  // -- AI Generator Implementation --
  const handleAIGeneration = async () => {
    if (!aiSourceText.trim()) return;
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: aiSourceText }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }
      
      if (data.questions && Array.isArray(data.questions)) {
        setTitle("AI Generated Knowledge Check");
        setDescription(`Generated from source material: "${aiSourceText.substring(0, 50)}..."`);
        setQuestions([...questions, ...data.questions]);
        setActiveTab("MANUAL");
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with AI engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  // -- Finalization --
  const saveExam = async () => {
    setErrorMsg("");
    if (!title || questions.length === 0) return setErrorMsg("Title and at least 1 question required.");
    
    // Ensure all questions have a correct answer selected out of non-empty options
    const valid = questions.every(q => q.text && q.correct_answer && q.options.filter(o => o.trim()).length >= 2);
    if (!valid) return setErrorMsg("Please ensure all questions have text, at least 2 options, and a correct answer selected.");

    const examData = {
      title,
      description,
      duration_minutes: durationMinutes > 0 ? durationMinutes : undefined,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options.filter(o => o.trim()),
        correct_answer: q.correct_answer
      }))
    };

    try {
      await uploadExam({
        title: examData.title,
        description: examData.description,
        questions: examData.questions,
        duration_minutes: examData.duration_minutes
      });
      router.push("/dashboard/admin");
    } catch (err: any) {
      setErrorMsg("Failed to upload exam to database: " + err.message);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 z-10 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-white flex items-center gap-3 tracking-wider">
            <BrainCircuit className="w-8 h-8 text-purple-400" /> ADVANCED EXAM BUILDER
          </h2>
          <p className="text-slate-400 mt-2 font-inter">Create tests manually or use Sentinel AI to generate them instantly.</p>
        </div>
        <Link 
          href="/dashboard/admin"
          className="px-6 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors font-orbitron tracking-widest text-sm"
        >
          &larr; BACK
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("MANUAL")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold font-orbitron tracking-wide transition-all ${
            activeTab === "MANUAL" 
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
              : "text-slate-400 hover:bg-white/5"
          }`}
        >
          <PenTool className="w-4 h-4" /> MANUAL BUILDER
        </button>
        <button 
          onClick={() => setActiveTab("AI")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold font-orbitron tracking-wide transition-all ${
            activeTab === "AI" 
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
              : "text-slate-400 hover:bg-white/5"
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> SENTINEL AI GENERATOR
        </button>
      </div>

      <div className="flex gap-8 items-start">
        
        {/* Left Col: The Form/Generator */}
        <div className="flex-1 flex flex-col gap-6">
          {activeTab === "AI" ? (
            <div className="glass-panel p-8 flex flex-col gap-6">
              <h3 className="text-xl font-orbitron font-bold text-purple-400">GENERATE FROM SOURCE MATERIAL</h3>
              <p className="text-slate-400">Paste your syllabus, lecture notes, or any raw text below. Sentinel AI will instantly parse the context and generate a multi-question evaluation schema.</p>
              
              <textarea 
                value={aiSourceText}
                onChange={(e) => setAiSourceText(e.target.value)}
                className="bg-black/40 border border-purple-500/20 rounded-xl p-4 w-full h-64 text-slate-200 focus:border-purple-400 outline-none font-inter resize-none"
                placeholder="Paste context here... Example: 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy...'"
              />
              
              <button 
                onClick={handleAIGeneration}
                disabled={!aiSourceText.trim() || isGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold font-orbitron tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
              >
                {isGenerating ? <ShieldCheck className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                {isGenerating ? "ANALYZING CONTEXT & GENERATING..." : "GENERATE EXAM WITH AI"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Manual Core Details */}
              <div className="glass-panel p-8 flex flex-col gap-6">
                <input 
                  type="text"
                  placeholder="Exam Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-b border-white/20 pb-2 text-3xl font-orbitron font-bold text-cyan-400 focus:border-cyan-400 outline-none w-full transition-colors"
                />
                <input 
                  type="text"
                  placeholder="Exam Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent border-b border-white/10 pb-2 text-lg text-slate-400 focus:border-white/30 outline-none w-full transition-colors"
                />
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="font-orbitron text-sm tracking-widest">TIME LIMIT (MINUTES):</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 60 (0 for unlimited)"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 w-32 outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="flex flex-col gap-6">
                {questions.map((q, qIndex) => (
                  <div key={q.id} className="glass-panel p-6 flex flex-col gap-6 relative group border-l-4 border-l-cyan-500">
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-4">
                      <span className="text-cyan-500 font-orbitron font-bold text-xl pt-2">Q{qIndex + 1}.</span>
                      <textarea 
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Enter your question here..."
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-slate-200 outline-none focus:border-cyan-500/50 min-h-[80px]"
                      />
                    </div>
                    
                    <div className="pl-12 flex flex-col gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <input 
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correct_answer === opt && opt !== ""}
                            onChange={() => setCorrectOption(q.id, opt)}
                            disabled={!opt.trim()}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 bg-black/20 border border-white/10 rounded-md p-2 text-sm text-slate-300 outline-none focus:border-cyan-500/40"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addQuestion}
                  className="glass-panel p-6 border-dashed border-2 border-white/20 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <PlusCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="font-orbitron font-bold tracking-widest text-sm">ADD QUESTION</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Save Actions */}
        <div className="w-80 glass-panel p-6 sticky top-24 flex flex-col gap-6">
          <div>
            <h3 className="text-cyan-400 font-orbitron font-bold tracking-widest text-sm mb-2">DATABASE PERSISTENCE</h3>
            <p className="text-xs text-slate-400">Exams are secured in the Supabase schema or LocalStorage fallback, ready for candidate distribution.</p>
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-black/30 border border-white/5 rounded-xl text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold text-cyan-400">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-green-400">DRAFT</span>
            </div>
          </div>
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-inter">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={saveExam}
            disabled={questions.length === 0}
            className="w-full py-4 mt-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-orbitron flex items-center justify-center gap-2"
          >
            FINALIZE EXAM <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
