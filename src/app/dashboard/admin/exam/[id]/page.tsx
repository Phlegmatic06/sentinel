"use client";

import { useEffect, useState, use } from "react";
import { getExamById, fetchSubmissionsByExam, Exam, ExamSubmission } from "@/lib/examService";
import { Users, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExamSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const examId = unwrappedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const [e, s] = await Promise.all([
        getExamById(examId),
        fetchSubmissionsByExam(examId)
      ]);
      if (e) setExam(e);
      setSubmissions(s || []);
      setLoading(false);
    };
    init();
  }, [examId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center animate-pulse text-purple-400 font-medium">Loading Submissions...</div>;
  }

  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center text-red-400 text-xl font-bold">Exam not found.</div>;
  }

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 z-10 relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard/admin" className="text-slate-500 hover:text-purple-400 transition-colors">
              Admin
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-medium">Submissions</span>
          </div>
          <h2 className="text-3xl font-bold text-white mt-2 flex items-center gap-3 tracking-tight">
            <Users className="w-7 h-7 text-purple-400" /> {exam.title}
          </h2>
          <p className="text-slate-400 mt-1.5">Review candidate performance and test outcomes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2.5 flex items-center gap-4 text-sm font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Questions:</span> <span className="text-purple-400 font-bold">{exam.questions.length}</span>
            </div>
            <div className="w-px h-4 bg-white/8" />
            <div>
              <span className="text-slate-500">Submissions:</span> <span className="text-violet-400 font-bold">{submissions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-base font-semibold text-purple-400 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Candidate Records
        </h3>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/2 rounded-xl border border-white/5 text-slate-500">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-50 text-purple-400" />
            <p className="text-lg font-semibold">No Submissions Yet</p>
            <p className="text-sm mt-1">Share the test link with candidates to collect data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 border-b border-white/6 text-xs tracking-wider font-medium">
                  <th className="pb-3 pl-4">Candidate</th>
                  <th className="pb-3 text-center">Score</th>
                  <th className="pb-3 text-center">Percentage</th>
                  <th className="pb-3 text-right pr-4">Completion Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {submissions.map((sub) => {
                  const percentage = Math.round((sub.score / sub.total_questions) * 100);
                  const isPass = percentage >= 60;
                  
                  return (
                    <tr key={sub.id} className="hover:bg-white/3 transition-colors group">
                      <td className="py-4 pl-4 font-semibold text-slate-200">{sub.candidate_name || "Unknown"}</td>
                      <td className="py-4 text-center text-purple-400 font-mono font-bold">
                        {sub.score} / {sub.total_questions}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold font-mono ${
                          isPass ? "bg-green-500/10 text-green-400 border border-green-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4 text-slate-500 text-sm font-mono">
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
