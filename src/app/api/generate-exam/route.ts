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

    const prompt = `You are an expert educational assessment creator. Based on the following source material, generate 3 to 5 multiple-choice questions that test key concepts.
You MUST respond with a strictly valid JSON array of question objects. Do not include any markdown formatting, backticks, or explanation.
Each object must have the exact following structure:
{
  "id": "a unique string like ai_q1",
  "text": "the question text",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correct_answer": "the exact string of the correct option"
}

Source Material:
${sourceText}`;

    // 'llama3-8b-8192' or 'mixtral-8x7b-32768' are reliable fast models on Groq
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
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
