"use client";

import { useState, useEffect } from "react";
import { FileJson, CheckCircle, Database, Trash2, Edit, Copy, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadExam, fetchExams, deleteExam, Exam } from "@/lib/examService";
import { SmartImporter } from "@/components/SmartImporter";

export default function AdminPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadExams = async () => {
    setLoading(true);
    const data = await fetchExams();
    setExams(data);
    setLoading(false);
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the exam "${title}"?`)) {
      setLoading(true);
      const success = await deleteExam(id);
      if (success) {
        loadExams();
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadExams();
  }, []);


  return (
    <div className="flex-1 p-8 pt-32 max-w-7xl mx-auto w-full flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
            <Database className="text-purple-600 dark:text-purple-400 w-7 h-7" />
            Test Admin Console
          </h2>
          <p className="text-[var(--text-secondary)] mt-1.5 font-medium opacity-90">Manage MCQ exams and test sheets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/admin/builder"
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.25)] text-white"
          >
            + Create Exam
          </Link>
          <Link 
            href="/dashboard"
            className="px-5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Back to Vault
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

      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        
        {/* Smart Import Center */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Smart Import Center</h3>
          </div>
          <SmartImporter onImportComplete={loadExams} />
        </section>
        

        {/* Exam List */}
        <div className="glass-panel p-6 flex flex-col gap-4 border border-[var(--border-primary)] shadow-sm">
          <h3 className="text-base font-bold text-purple-600 dark:text-purple-400 mb-1">Available Exams</h3>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-2">
            {loading ? (
              <p className="text-slate-500 italic animate-pulse">Loading exams...</p>
            ) : exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white/2 rounded-xl border border-white/5 text-slate-500">
                <FileJson className="w-10 h-10 mb-2 opacity-50" />
                <p>No exams uploaded yet.</p>
              </div>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="bg-white/50 dark:bg-white/3 border border-[var(--border-primary)] hover:border-purple-500/30 dark:hover:border-purple-500/20 transition-all p-4 rounded-xl flex flex-col gap-2 relative group shadow-sm hover:shadow-md">
                  <h4 className="text-[var(--text-primary)] font-bold">{exam.title}</h4>
                  <p className="text-[var(--text-secondary)] text-sm font-medium opacity-80">{exam.questions.length} Questions • {new Date(exam.created_at).toLocaleDateString()}</p>
                  
                  <div className="mt-2 pt-3 border-t border-[var(--border-primary)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono opacity-60">ID: {exam.id.slice(0, 8).toUpperCase()}...</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/builder?edit=${exam.id}`}
                        className="text-xs bg-blue-500/8 text-blue-400 px-3 py-1 rounded-md border border-blue-500/15 hover:bg-blue-500/15 transition-colors flex items-center gap-1"
                        title="Edit Exam"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="text-xs bg-red-500/8 text-red-400 px-3 py-1 rounded-md border border-red-500/15 hover:bg-red-500/15 transition-colors flex items-center gap-1"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                      <Link 
                        href={`/dashboard/admin/exam/${exam.id}`}
                        className="text-xs bg-purple-500/8 text-purple-400 px-3 py-1 rounded-md border border-purple-500/15 hover:bg-purple-500/15 transition-colors"
                      >
                        Submissions
                      </Link>
                      <button 
                        onClick={() => handleCopyLink(exam.id)}
                        className="text-xs bg-violet-500/8 text-violet-400 px-3 py-1 rounded-md border border-violet-500/15 hover:bg-violet-500/15 transition-colors flex items-center gap-1"
                        title="Copy Exam Link"
                      >
                        {copiedId === exam.id ? (
                          <><CheckCircle className="w-3 h-3" /> Copied</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copy Link</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
