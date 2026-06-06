"use client";

import { supabase } from "./supabase";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number; // Optional exam timer
  questions: Question[];
  created_at: string;
  user_id?: string;
}

export interface ExamSubmission {
  id: string;
  exam_id: string;
  candidate_name: string;
  answers: { [questionId: string]: string };
  score: number;
  total_questions: number;
  created_at: string;
}

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-url.supabase.co";
};

export async function uploadExam(examData: Omit<Exam, 'id' | 'created_at'>): Promise<string> {
  let userId = null;
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  }

  const id = crypto.randomUUID();
  const exam: Exam = {
    ...examData,
    id,
    created_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {})
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('sentinel_exams').insert(exam);
    if (error) console.error("Supabase Exam Upload Error:", error);
  } else {
    if (typeof window !== "undefined") {
      const exams = JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]');
      exams.push(exam);
      window.localStorage.setItem('sentinel_exams', JSON.stringify(exams));
    }
  }
  return id;
}

export async function fetchExams(): Promise<Exam[]> {
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return []; // User must be logged in to fetch exams in dashboard

    const { data, error } = await supabase
      .from('sentinel_exams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      return [];
    }
    return data as Exam[];
  } else {
    if (typeof window !== "undefined") {
      return JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]');
    }
    return [];
  }
}

export async function deleteExam(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('sentinel_exams').delete().eq('id', id);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  } else {
    if (typeof window !== "undefined") {
      let exams = JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]') as Exam[];
      exams = exams.filter(e => e.id !== id);
      window.localStorage.setItem('sentinel_exams', JSON.stringify(exams));
      return true;
    }
    return false;
  }
}

export async function updateExam(id: string, examData: Partial<Omit<Exam, 'id' | 'created_at'>>): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('sentinel_exams').update(examData).eq('id', id);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  } else {
    if (typeof window !== "undefined") {
      const exams = JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]') as Exam[];
      const index = exams.findIndex(e => e.id === id);
      if (index !== -1) {
        exams[index] = { ...exams[index], ...examData };
        window.localStorage.setItem('sentinel_exams', JSON.stringify(exams));
        return true;
      }
    }
    return false;
  }
}

export async function getExamById(id: string): Promise<Exam | null> {
  if (isSupabaseConfigured()) {
    // Try to fetch the full exam data (only works if user is the authenticated owner due to RLS)
    const { data: adminData } = await supabase
      .from('sentinel_exams')
      .select('*')
      .eq('id', id)
      .single();
      
    if (adminData) return adminData as Exam;

    // Fallback: Use the safe RPC that strips correct answers for candidates
    const { data: safeData, error: rpcError } = await supabase
      .rpc('get_safe_exam', { p_exam_id: id });
    
    if (!rpcError && safeData) {
      return safeData as Exam;
    }
    
    return null;
  } else {
    if (typeof window !== "undefined") {
      const exams = JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]') as Exam[];
      return exams.find(e => e.id === id) || null;
    }
    return null;
  }
}

export async function submitExamAnswers(submissionData: Omit<ExamSubmission, 'id' | 'created_at'>): Promise<{id: string, score: number, total: number}> {
  if (isSupabaseConfigured()) {
    // Call the secure RPC to calculate score on the server and insert
    const { data: rpcData, error } = await supabase.rpc('submit_exam_secure', {
      p_exam_id: submissionData.exam_id,
      p_candidate_name: submissionData.candidate_name,
      p_answers: submissionData.answers
    });
    
    if (error || !rpcData) {
      console.error("Supabase Submit Error:", error);
      throw new Error(error?.message || "Failed to submit exam");
    }

    // RPC returns "id|score|total"
    const [subId, score, total] = rpcData.split('|');
    return { 
      id: subId, 
      score: parseInt(score), 
      total: parseInt(total) 
    };
  } else {
    const id = crypto.randomUUID();
    const submission: ExamSubmission = {
      ...submissionData,
      id,
      created_at: new Date().toISOString()
    };
    if (typeof window !== "undefined") {
      const submissions = JSON.parse(window.localStorage.getItem('sentinel_submissions') || '[]');
      submissions.push(submission);
      window.localStorage.setItem('sentinel_submissions', JSON.stringify(submissions));
    }
    return { id, score: submissionData.score, total: submissionData.total_questions };
  }
}

export async function fetchSubmissionsByExam(examId: string): Promise<ExamSubmission[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('sentinel_submissions').select('*').eq('exam_id', examId).order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data as ExamSubmission[];
  } else {
    if (typeof window !== "undefined") {
      const subs = JSON.parse(window.localStorage.getItem('sentinel_submissions') || '[]') as ExamSubmission[];
      return subs.filter(s => s.exam_id === examId);
    }
    return [];
  }
}
