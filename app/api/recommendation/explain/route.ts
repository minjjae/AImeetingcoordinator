import OpenAI from "openai";
import { NextResponse } from "next/server";

type ExplanationRequest = {
  group?: {
    name?: string;
    averageAttendance?: number;
    preferredMeetingTime?: string;
    meeting?: { title?: string; meetingNumber?: number; duration?: number };
  };
  candidate?: {
    day?: string;
    time?: string;
    available?: number;
    total?: number;
    unavailableMembers?: string[];
    score?: number;
    reasons?: string[];
  };
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Add OPENAI_API_KEY to .env.local, then retry." },
      { status: 503 },
    );
  }

  let body: ExplanationRequest;
  try {
    body = (await request.json()) as ExplanationRequest;
  } catch {
    return NextResponse.json({ error: "The recommendation context is invalid." }, { status: 400 });
  }

  if (!body.group?.name || !body.candidate?.day || !body.candidate.time || typeof body.candidate.score !== "number") {
    return NextResponse.json({ error: "The recommendation context is incomplete." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions:
        "You explain a deterministic team scheduling recommendation. Never propose a different time or change the score. Write 2 concise sentences in plain language. Mention the strongest availability fact and one useful team-context factor. Do not use headings, bullets, or hype.",
      input: JSON.stringify(body),
      max_output_tokens: 140,
    });
    const explanation = response.output_text.trim();

    if (!explanation) {
      throw new Error("The model returned an empty explanation.");
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("OpenAI recommendation explanation failed", error);
    return NextResponse.json(
      { error: "Featy could not reach OpenAI. Check the API key and model, then retry." },
      { status: 502 },
    );
  }
}
