"use client";

import { useEffect, useState, use } from "react";
import { getExamById, fetchSubmissionsByExamOutput, Exam, ExamSubmission } from "@/lib/examService";
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
        fetchSubmissionsByExamOutput(examId)
      ]);
      if (e) setExam(e);
      setSubmissions(s || []);
      setLoading(false);
    };
    init();
  }, [examId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-orbitron animate-pulse text-cyan-400">Loading Submissions...</div>;
  }

  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center font-inter text-red-500 text-xl font-bold">Exam not found.</div>;
  }

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 z-10 relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin" className="text-slate-500 hover:text-cyan-400 transition-colors">
              Admin
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-500 font-orbitron font-bold">Submissions</span>
          </div>
          <h2 className="text-3xl font-orbitron font-bold text-white mt-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" /> {exam.title}
          </h2>
          <p className="text-slate-400 mt-1 font-inter">Review candidate performance and test outcomes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-4 text-sm font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Total Queries:</span> <span className="text-cyan-400 font-bold">{exam.questions.length}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <span className="text-slate-500">Submissions:</span> <span className="text-purple-400 font-bold">{submissions.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <h3 className="text-lg font-bold text-cyan-400 font-orbitron mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5" /> CANDIDATE RECORDS
        </h3>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-black/20 rounded-xl border border-white/5 text-slate-500">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-50 text-cyan-500" />
            <p className="text-lg font-orbitron">NO SUBMISSIONS YET</p>
            <p className="text-sm font-inter">Share the test link with candidates to collect data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-inter">
              <thead>
                <tr className="text-slate-500 border-b border-white/10 text-xs tracking-widest font-orbitron">
                  <th className="pb-3 pl-4">CANDIDATE</th>
                  <th className="pb-3 text-center">SCORE</th>
                  <th className="pb-3 text-center">PERCENTAGE</th>
                  <th className="pb-3 text-right pr-4">COMPLETION TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((sub) => {
                  const percentage = Math.round((sub.score / sub.total_questions) * 100);
                  const isPass = percentage >= 60;
                  
                  return (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 pl-4 font-bold text-slate-200">{sub.candidate_name || "Unknown"}</td>
                      <td className="py-4 text-center text-cyan-400 font-mono font-bold">
                        {sub.score} / {sub.total_questions}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                          isPass ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4 text-slate-500 text-sm">
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
