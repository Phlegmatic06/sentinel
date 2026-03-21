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
  const id = crypto.randomUUID();
  const exam: Exam = {
    ...examData,
    id,
    created_at: new Date().toISOString()
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
    const { data, error } = await supabase.from('sentinel_exams').select('*').order('created_at', { ascending: false });
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
    const { data, error } = await supabase.from('sentinel_exams').select('*').eq('id', id).single();
    if (error) return null;
    return data as Exam;
  } else {
    if (typeof window !== "undefined") {
      const exams = JSON.parse(window.localStorage.getItem('sentinel_exams') || '[]') as Exam[];
      return exams.find(e => e.id === id) || null;
    }
    return null;
  }
}

export async function submitExamAnswers(submissionData: Omit<ExamSubmission, 'id' | 'created_at'>): Promise<string> {
  const id = crypto.randomUUID();
  const submission: ExamSubmission = {
    ...submissionData,
    id,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('sentinel_submissions').insert(submission);
    if (error) console.error("Supabase Submit Error:", error);
  } else {
    if (typeof window !== "undefined") {
      const submissions = JSON.parse(window.localStorage.getItem('sentinel_submissions') || '[]');
      submissions.push(submission);
      window.localStorage.setItem('sentinel_submissions', JSON.stringify(submissions));
    }
  }
  return id;
}

export async function fetchSubmissionsByExamOutput(examId: string): Promise<ExamSubmission[]> {
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
