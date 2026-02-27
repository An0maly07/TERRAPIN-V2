import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import type { QuizQuestion } from "@/types/quiz";

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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 }
    );
  }

  let category: string;
  try {
    const body = await request.json();
    category = body.category;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!category || typeof category !== "string") {
    return NextResponse.json(
      { error: "A valid 'category' string is required" },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      `Generate a geography quiz question through the lens of the "${category}" category. Make it unique and creative.`
    );

    const text = result.response.text();
    const data: QuizQuestion = JSON.parse(text);

    // Validate the response shape
    if (
      !data.question ||
      !Array.isArray(data.options) ||
      data.options.length !== 4 ||
      typeof data.correctAnswerIndex !== "number" ||
      data.correctAnswerIndex < 0 ||
      data.correctAnswerIndex > 3 ||
      !data.coordinates?.lat ||
      !data.coordinates?.lng ||
      !data.funFact
    ) {
      return NextResponse.json(
        { error: "AI returned an invalid question format" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz question" },
      { status: 500 }
    );
  }
}
