"use client";

import { useState } from "react";
import { BrainCircuit, FileSpreadsheet, Sparkles, UploadCloud, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { uploadExam } from "@/lib/examService";
import type { Question } from "@/lib/examService";

interface SmartImporterProps {
  onImportComplete: () => void;
}

export function SmartImporter({ onImportComplete }: SmartImporterProps) {
  const [mode, setMode] = useState<"IDLE" | "AI" | "CSV" | "PREVIEW">("IDLE");
  const [aiText, setAiText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<Partial<Question>[]>([]);
  const [examTitle, setExamTitle] = useState("Imported Exam");
  const [error, setError] = useState<string | null>(null);

  const handleAiImport = async () => {
    if (!aiText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: aiText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed to parse content.");
      
      setPreviewQuestions(data.questions);
      setMode("PREVIEW");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        // Skip header if it looks like one
        const startIndex = lines[0].toLowerCase().includes("question") ? 1 : 0;
        
        const questions: Partial<Question>[] = lines.slice(startIndex).map((line, idx) => {
          const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
          // Format: Question, OptA, OptB, OptC, OptD, Correct
          return {
            id: `csv_q_${idx}`,
            text: parts[0] || "Empty Question",
            options: parts.slice(1, 5).filter(o => o) || [],
            correct_answer: parts[5] || ""
          };
        });

        if (questions.length === 0) throw new Error("No questions found in CSV.");
        setPreviewQuestions(questions);
        setMode("PREVIEW");
      } catch (err: any) {
        setError("Invalid CSV format. Please use: Question, Opt1, Opt2, Opt3, Opt4, Correct");
      }
    };
    reader.readAsText(file);
  };

  const finalizeImport = async () => {
    setIsProcessing(true);
    try {
      const validQuestions = previewQuestions.filter(q => q.text && q.options && q.options.length >= 2 && q.correct_answer) as Question[];
      if (validQuestions.length === 0) throw new Error("No valid questions to save.");

      await uploadExam({
        title: examTitle,
        description: `Imported via ${mode === "AI" ? "AI Magic Paste" : "CSV Upload"}`,
        questions: validQuestions,
        duration_minutes: 60
      });

      onImportComplete();
      setMode("IDLE");
      setAiText("");
      setPreviewQuestions([]);
      setExamTitle("Imported Exam");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "PREVIEW") {
    return (
      <div className="glass-panel p-6 border-2 border-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
            <input 
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-purple-500/30 text-[var(--text-primary)] outline-none focus:border-purple-500"
              placeholder="Enter Exam Title..."
            />
            <p className="text-sm text-[var(--text-secondary)]">Review and edit imported questions before saving.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMode("IDLE")}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={finalizeImport}
              disabled={isProcessing}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Exam
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {previewQuestions.map((q, idx) => (
            <div key={idx} className="bg-white/5 dark:bg-white/3 p-4 rounded-xl border border-[var(--border-primary)] group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Question {idx + 1}</span>
                <button 
                  onClick={() => setPreviewQuestions(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea 
                value={q.text}
                onChange={(e) => {
                  const newQs = [...previewQuestions];
                  newQs[idx] = { ...newQs[idx], text: e.target.value };
                  setPreviewQuestions(newQs);
                }}
                className="w-full bg-transparent text-[var(--text-primary)] font-medium outline-none resize-none mb-3"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                {q.options?.map((opt, oIdx) => (
                  <div 
                    key={oIdx} 
                    className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                      opt === q.correct_answer 
                        ? "bg-green-500/10 border-green-500/20 text-green-500" 
                        : "bg-white/2 border-[var(--border-primary)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${opt === q.correct_answer ? "bg-green-500" : "bg-slate-400"}`} />
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Magic Paste Card */}
      <div 
        className={`glass-panel p-6 border-2 transition-all relative overflow-hidden group ${
          mode === "AI" ? "border-purple-500/40 bg-purple-500/5 shadow-inner" : "border-[var(--border-primary)] hover:border-purple-500/30"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">AI Magic Paste</h4>
            <p className="text-xs text-[var(--text-secondary)]">Paste unstructured text from any source.</p>
          </div>
        </div>

        {mode === "AI" ? (
          <div className="flex flex-col gap-3 animate-in zoom-in-95 duration-200">
            <textarea 
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              className="w-full h-32 bg-white/5 dark:bg-white/3 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-purple-500/50 resize-none font-medium"
              placeholder="Paste questions, notes, or raw content here..."
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAiImport}
                disabled={isProcessing || !aiText.trim()}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                Scan Content
              </button>
              <button 
                onClick={() => setMode("IDLE")}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setMode("AI")}
            className="w-full py-2 bg-white/5 dark:bg-white/3 border border-white/5 rounded-lg text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/5 transition-all"
          >
            Start Magic Paste
          </button>
        )}
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
           <BrainCircuit className="w-16 h-16 text-purple-500" />
        </div>
      </div>

      {/* CSV Upload Card */}
      <div 
        className={`glass-panel p-6 border-2 transition-all relative overflow-hidden group ${
          mode === "CSV" ? "border-blue-500/40 bg-blue-500/5 shadow-inner" : "border-[var(--border-primary)] hover:border-blue-500/30"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">CSV Sheet Upload</h4>
            <p className="text-xs text-[var(--text-secondary)]">Upload structured Excel/CSV documents.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleCsvUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onClick={() => setMode("CSV")}
            />
            <div className="w-full py-8 border-2 border-dashed border-blue-500/15 rounded-xl flex flex-col items-center justify-center gap-2 bg-white/3 group-hover:bg-blue-500/5 transition-all">
               <UploadCloud className="w-6 h-6 text-blue-400 mb-1 group-hover:bounce" />
               <span className="text-xs font-semibold text-blue-500">Drop CSV or Click to Upload</span>
               <span className="text-[10px] text-slate-500">Format: Question, A, B, C, D, Answer</span>
            </div>
          </div>
          <button 
            onClick={() => {
              const csvContent = "Question,Option A,Option B,Option C,Option D,Correct Answer\nWhat is AI?,Artificial Intel,Code,Robot,Magic,Artificial Intel";
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sentinel_template.csv";
              a.click();
            }}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider text-center transition-colors"
          >
            Download CSV Template
          </button>
        </div>

        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
           <FileSpreadsheet className="w-16 h-16 text-blue-500" />
        </div>
      </div>

      {error && (
        <div className="md:col-span-2 flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-xs rounded-xl animate-in shake-in duration-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
