"use client";

import { useState, useEffect } from "react";
import { Upload, FileJson, CheckCircle, Database, Trash2, Edit, Copy, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadExam, fetchExams, deleteExam, Exam } from "@/lib/examService";

export default function AdminPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
        setSuccessMsg(`Exam "${title}" deleted successfully.`);
        loadExams();
      } else {
        setErrorMsg(`Failed to delete exam "${title}".`);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Very basic validation
        if (!parsed.title || !Array.isArray(parsed.questions)) {
          throw new Error("Invalid JSON format. Must contain 'title' and an array of 'questions'.");
        }

        await uploadExam({
          title: parsed.title,
          description: parsed.description || "",
          duration_minutes: parsed.duration_minutes,
          questions: parsed.questions
        });

        setSuccessMsg(`Exam "${parsed.title}" uploaded successfully!`);
        loadExams(); // refresh list
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to parse JSON file.");
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="flex-1 p-8 pt-32 max-w-7xl mx-auto w-full flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Database className="text-purple-400 w-7 h-7" />
            Test Admin Console
          </h2>
          <p className="text-slate-400 mt-1.5">Manage MCQ exams and test sheets.</p>
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
            className="px-5 py-2 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 transition-colors text-sm font-medium text-slate-300"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Interface */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-purple-400 mb-1">Upload Test Sheet (.JSON)</h3>
          
          <div className="border-2 border-dashed border-purple-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/3 transition-colors cursor-pointer relative group">
            <Upload className="w-10 h-10 text-slate-500 group-hover:text-purple-400 transition-colors mb-4" />
            <p className="text-slate-300 font-medium">Click or drag a JSON file here</p>
            <p className="text-slate-500 text-sm mt-2">Must contain &apos;title&apos; and &apos;questions&apos; array</p>
            <input  
              type="file" 
              accept=".json"
              title=""
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {errorMsg && (
            <div className="mt-2 bg-red-500/8 border border-red-500/15 text-red-400 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-2 bg-green-500/8 border border-green-500/15 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {successMsg}
            </div>
          )}

          <div className="mt-2 text-xs text-slate-500 bg-black/20 p-4 rounded-lg font-mono">
            <strong>Sample JSON Structure:</strong>
            <pre className="mt-2 overflow-x-auto text-purple-300/50">
{`{
  "title": "Computer Science 101",
  "questions": [
    {
      "id": "q1",
      "text": "What does CPU stand for?",
      "options": ["Central Processing Unit", "Computer Personal Unit"],
      "correct_answer": "Central Processing Unit"
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Exam List */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-purple-400 mb-1">Available Exams</h3>
          
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
                <div key={exam.id} className="bg-white/3 border border-white/5 hover:border-purple-500/20 transition-colors p-4 rounded-xl flex flex-col gap-2 relative group">
                  <h4 className="text-slate-200 font-semibold">{exam.title}</h4>
                  <p className="text-slate-400 text-sm">{exam.questions.length} Questions • {new Date(exam.created_at).toLocaleDateString()}</p>
                  
                  <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">ID: {exam.id.slice(0, 8)}...</span>
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
