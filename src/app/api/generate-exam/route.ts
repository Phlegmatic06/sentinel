import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const { sourceText } = await request.json();

    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
      return NextResponse.json({ error: 'Source text is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY environment variable is not configured.' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert at extracting and formatting educational assessments. 
Your task is to analyze the provided source material and extract multiple-choice questions (MCQs).

INSTRUCTIONS:
1. Extract as many clear MCQs as you can find (up to 10).
2. If the text is a general description, generate questions based on the key facts.
3. If the text already contains questions (e.g., "1. What is..."), extract them exactly as written.
4. Each question MUST have 2 to 4 options.
5. You MUST identify the correct answer based on the context or explicit answers in the text.
6. You MUST respond with a strictly valid JSON array of question objects. 
7. Do not include any markdown formatting, backticks, or text outside the JSON array.

JSON STRUCTURE:
{
  "id": "a unique string",
  "text": "the question text",
  "options": ["string1", "string2", ...],
  "correct_answer": "the exact string of the correct option"
}

Source Material:
${sourceText}`;

    // 'llama3-8b-8192' or 'mixtral-8x7b-32768' are reliable fast models on Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
    });

    const output = chatCompletion.choices[0]?.message?.content;
    if (!output) {
      throw new Error("Failed to generate content");
    }

    const cleanedOutput = output.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedOutput);
    
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message || 'An error occurred during generation' }, { status: 500 });
  }
}
