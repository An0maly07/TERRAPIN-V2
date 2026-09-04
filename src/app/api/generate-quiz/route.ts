import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { QuizQuestion } from "@/types/quiz";
import { QUIZ_CATEGORIES } from "@/components/quiz/categories";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a geography quiz master for TerraPin, a GeoGuessr-style game. You generate multiple-choice geography questions that are ALWAYS about real places, locations, countries, cities, landmarks, or geographic features.

The user will provide a category. This category determines the LENS through which you approach geography — but the answer must ALWAYS be about a place or geographic fact:

- "Arts & Literature": Questions about places famous for art, literature, authors' birthplaces, literary settings based on real locations, famous museums, etc.
- "Sports": Questions about locations of famous sporting events, stadiums, Olympic host cities, origins of sports, etc.
- "General Knowledge": Broad geography questions — capitals, borders, populations, geographic records, flags, currencies tied to countries.
- "Science & Nature": Questions about geographic locations known for natural phenomena, geological features, ecosystems, volcanic regions, biodiversity hotspots.
- "Entertainment": Questions about filming locations of famous movies/shows, locations of music festivals, birthplaces of celebrities, theme park locations, etc.
- "History": Questions about historically significant places — battle sites, ancient civilizations' locations, historical capitals, treaty signing locations, archaeological sites.
- "Geography": Pure geography — physical features, rivers, mountain ranges, deserts, ocean currents, climate zones, tectonic plates.

Rules:
- The question MUST be about a real geographic location or place-related fact.
- Provide exactly 4 plausible options where only one is correct. All options should be of the same type (e.g., all cities, all countries, all landmarks).
- Make distractors plausible — they should be real places that someone might confuse with the correct answer.
- correctAnswerIndex is the 0-based index of the correct option.
- coordinates must be real lat/lng for the location the question is about (the correct answer's location).
- funFact should be a short, surprising geographic or historical fact about the correct answer location.
- Vary difficulty: mix easy, medium, and hard questions.
- Be creative and avoid repetitive question patterns.

You MUST respond with valid JSON matching this exact schema:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswerIndex": number,
  "coordinates": { "lat": number, "lng": number },
  "funFact": "string"
}`;

/** Only the labels we ship are accepted — the category is never free text in the prompt. */
const ALLOWED_CATEGORIES = new Set(QUIZ_CATEGORIES.map((c) => c.label));

const GEMINI_TIMEOUT_MS = 12_000;

/* ── Per-user rate limit ──────────────────────────────────── */
// In-memory sliding window. Sufficient for a single long-lived instance; on
// a multi-instance/serverless deployment back this with Redis (e.g. Upstash)
// using the same (userId, windowMs, max) contract.
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const hits = (rateBuckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_MAX) {
    rateBuckets.set(key, hits);
    return false;
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  // Opportunistic cleanup so the map can't grow without bound.
  if (rateBuckets.size > 10_000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => t <= cutoff)) rateBuckets.delete(k);
    }
  }
  return true;
}

/* ── Response validation ──────────────────────────────────── */

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (typeof value !== "object" || value === null) return false;
  const q = value as Record<string, unknown>;
  const coords = q.coordinates as Record<string, unknown> | undefined;
  const idx = q.correctAnswerIndex;

  return (
    typeof q.question === "string" &&
    q.question.trim().length > 0 &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => typeof o === "string" && o.trim().length > 0) &&
    typeof idx === "number" &&
    Number.isInteger(idx) &&
    idx >= 0 &&
    idx <= 3 &&
    typeof coords === "object" &&
    coords !== null &&
    typeof coords.lat === "number" &&
    Number.isFinite(coords.lat) &&
    Math.abs(coords.lat) <= 90 &&
    typeof coords.lng === "number" &&
    Number.isFinite(coords.lng) &&
    Math.abs(coords.lng) <= 180 &&
    typeof q.funFact === "string"
  );
}

function errorStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

function isAbortLike(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /abort|timeout/i.test(err.name) || /abort|timed? ?out/i.test(err.message);
}

/* ── Handler ──────────────────────────────────────────────── */

export async function POST(request: Request) {
  // The proxy already gates this route, but never rely on middleware alone
  // for an endpoint that spends money.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimitAllow(user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 }
    );
  }

  let category: unknown;
  try {
    const body: unknown = await request.json();
    category =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).category
        : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof category !== "string" || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 512,
        temperature: 0.9,
      },
    });

    // The category is a vetted token, not an interpolated sentence fragment,
    // which removes the prompt-injection surface.
    const result = await model.generateContent(
      { contents: [{ role: "user", parts: [{ text: `Category: ${category}` }] }] },
      { signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS) }
    );

    const parsed: unknown = JSON.parse(result.response.text());

    if (!isQuizQuestion(parsed)) {
      return NextResponse.json(
        { error: "AI returned an invalid question format" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (errorStatus(error) === 429) {
      return NextResponse.json(
        { error: "Quiz service is busy. Please retry in a moment." },
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }
    if (isAbortLike(error)) {
      return NextResponse.json(
        { error: "Quiz generation timed out. Please retry." },
        { status: 504 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned malformed JSON" },
        { status: 502 }
      );
    }
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz question" },
      { status: 500 }
    );
  }
}
