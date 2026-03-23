"use client";

import { useState, useEffect } from "react";
import { uploadExam, updateExam, getExamById } from "@/lib/examService";
import { ShieldCheck, BrainCircuit, PenTool, PlusCircle, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type QuestionDraft = {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  correct_index?: number; // track by index to prevent identical string bugs
};

export default function ExamBuilderPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"MANUAL" | "AI">("MANUAL");
  
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('edit');
    if (id) {
      getExamById(id).then(exam => {
        if (exam) {
          setEditId(id);
          setTitle(exam.title);
          setDescription(exam.description || "");
          setDurationMinutes(exam.duration_minutes || 0);
          setQuestions(exam.questions.map(q => ({
            ...q,
            correct_index: q.options.indexOf(q.correct_answer)
          })));
        }
      });
    }
  }, []);

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
        correct_index: -1,
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
        
        let newCorrectAnswer = q.correct_answer;
        if (q.correct_index === optIdx) {
           newCorrectAnswer = val;
        }

        return { ...q, options: newOpts, correct_answer: newCorrectAnswer };
      }
      return q;
    }));
  };

  const setCorrectOption = (qId: string, optIdx: number, val: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correct_answer: val, correct_index: optIdx } : q));
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
        setQuestions([...questions, ...data.questions.map((q: any) => ({
          ...q,
          correct_index: q.options.indexOf(q.correct_answer)
        }))]);
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
    const valid = questions.every(q => q.text && q.correct_index !== undefined && q.correct_index >= 0 && q.options[q.correct_index]?.trim() && q.options.filter(o => o.trim()).length >= 2);
    if (!valid) return setErrorMsg("Please ensure all questions have text, at least 2 options, and a correct answer selected.");

    const examData = {
      title,
      description,
      duration_minutes: durationMinutes > 0 ? durationMinutes : undefined,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options.filter(o => o.trim()),
        correct_answer: q.options[q.correct_index!] // safely grab correct string value
      }))
    };

    try {
      if (editId) {
        await updateExam(editId, {
          title: examData.title,
          description: examData.description,
          questions: examData.questions,
          duration_minutes: examData.duration_minutes
        });
      } else {
        await uploadExam({
          title: examData.title,
          description: examData.description,
          questions: examData.questions,
          duration_minutes: examData.duration_minutes
        });
      }
      router.push("/dashboard/admin");
    } catch (err: any) {
      setErrorMsg("Failed to upload exam to database: " + err.message);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 z-10 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <BrainCircuit className="w-7 h-7 text-purple-400" /> Advanced Exam Builder
          </h2>
          <p className="text-slate-400 mt-2">Create tests manually or use Sentinel AI to generate them instantly.</p>
        </div>
        <Link 
          href="/dashboard/admin"
          className="px-5 py-2 rounded-lg border border-white/8 text-slate-300 hover:bg-white/5 transition-colors text-sm font-medium"
        >
          &larr; Back
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/6 pb-4">
        <button 
          onClick={() => setActiveTab("MANUAL")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === "MANUAL" 
              ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" 
              : "text-slate-400 hover:bg-white/5"
          }`}
        >
          <PenTool className="w-4 h-4" /> Manual Builder
        </button>
        <button 
          onClick={() => setActiveTab("AI")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === "AI" 
              ? "bg-violet-500/15 text-violet-400 border border-violet-500/20" 
              : "text-slate-400 hover:bg-white/5"
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Sentinel AI Generator
        </button>
      </div>

      <div className="flex gap-8 items-start">
        
        {/* Left Col: The Form/Generator */}
        <div className="flex-1 flex flex-col gap-6">
          {activeTab === "AI" ? (
            <div className="glass-panel p-8 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-violet-400">Generate From Source Material</h3>
              <p className="text-slate-400 text-sm">Paste your syllabus, lecture notes, or any raw text below. Sentinel AI will instantly parse the context and generate a multi-question evaluation schema.</p>
              
              <textarea 
                value={aiSourceText}
                onChange={(e) => setAiSourceText(e.target.value)}
                className="bg-white/3 border border-violet-500/15 rounded-xl p-4 w-full h-64 text-slate-200 focus:border-violet-400/50 outline-none resize-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                placeholder="Paste context here... Example: 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy...'"
              />
              
              <button 
                onClick={handleAIGeneration}
                disabled={!aiSourceText.trim() || isGenerating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-[0_0_25px_rgba(124,58,237,0.25)]"
              >
                {isGenerating ? <ShieldCheck className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                {isGenerating ? "Analyzing Context & Generating..." : "Generate Exam with AI"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Manual Core Details */}
              <div className="glass-panel p-8 flex flex-col gap-6">
                <input 
                  type="text"
                  placeholder="Exam Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-b border-white/10 pb-2 text-3xl font-bold text-purple-400 focus:border-purple-400/50 outline-none w-full transition-colors"
                />
                <input 
                  type="text"
                  placeholder="Exam Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-transparent border-b border-white/6 pb-2 text-lg text-slate-400 focus:border-white/20 outline-none w-full transition-colors"
                />
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="text-sm font-medium tracking-wide">Time Limit (minutes):</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 60 (0 for unlimited)"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="bg-white/3 border border-white/10 rounded-lg px-4 py-2 w-32 outline-none focus:border-purple-400/50 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="flex flex-col gap-6">
                {questions.map((q, qIndex) => (
                  <div key={q.id} className="glass-panel p-6 flex flex-col gap-6 relative group border-l-2 border-l-purple-500/50">
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="flex gap-4">
                      <span className="text-purple-400 font-bold text-lg pt-2">Q{qIndex + 1}.</span>
                      <textarea 
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Enter your question here..."
                        className="flex-1 bg-white/3 border border-white/6 rounded-lg p-3 text-slate-200 outline-none focus:border-purple-500/30 min-h-[80px] transition-all"
                      />
                    </div>
                    
                    <div className="pl-12 flex flex-col gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <input 
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correct_index === oIdx}
                            onChange={() => setCorrectOption(q.id, oIdx, opt)}
                            disabled={!opt.trim()}
                            className="w-4 h-4 accent-purple-500 cursor-pointer"
                          />
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="flex-1 bg-white/2 border border-white/6 rounded-md p-2.5 text-sm text-slate-300 outline-none focus:border-purple-500/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addQuestion}
                  className="glass-panel p-6 border-dashed border-2 border-white/10 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <PlusCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Add Question</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Save Actions */}
        <div className="w-80 glass-panel p-6 sticky top-24 flex flex-col gap-6">
          <div>
            <h3 className="text-purple-400 font-semibold text-sm mb-2">Database Persistence</h3>
            <p className="text-xs text-slate-400">Exams are secured in the Supabase schema or LocalStorage fallback, ready for candidate distribution.</p>
          </div>
          
          <div className="flex flex-col gap-2 p-4 bg-white/3 border border-white/5 rounded-xl text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold text-purple-400">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-green-400">DRAFT</span>
            </div>
          </div>
          
          {errorMsg && (
            <div className="bg-red-500/8 border border-red-500/15 text-red-400 p-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={saveExam}
            disabled={questions.length === 0}
            className="w-full py-3.5 mt-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-[0_0_25px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center gap-2"
          >
            {editId ? "Update Exam" : "Finalize Exam"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
