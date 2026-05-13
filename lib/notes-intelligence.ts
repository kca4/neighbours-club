/**
 * lib/notes-intelligence.ts — Neighbours Notes AI intelligence pipeline.
 *
 * Accepts raw news text + a source URL, calls Gemini 2.5 Flash, and returns
 * structured JSON suitable for editorial review or auto-publish.
 *
 * Errors are thrown — callers are responsible for try/catch. This mirrors the
 * contract of lib/email.ts (which soft-fails) but here a hard failure means
 * the ingestion pipeline should retry or alert, not silently swallow.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NoteCategory =
  | "Transit"
  | "DevApp"
  | "Safety"
  | "Social"
  | "Cost"
  | "Weather"
  | "Other";

export interface ImpactScores {
  safety: number; // 0–5
  cost: number;   // 0–5
  time: number;   // 0–5
}

export interface SummarizedNote {
  headline: string;              // max 80 chars
  summary: string;               // 2–3 sentences, neighbour-focused
  street_or_area: string;        // e.g. "Terry Fox Dr", "Kanata North", "Hazeldean Mall"
  category: NoteCategory;
  impact: ImpactScores;
  risk_score: number;            // 0–10
  auto_publish_eligible: boolean;
}

// ─── Zod schema (validates Gemini response shape) ─────────────────────────────

const SummarizedNoteSchema = z.object({
  headline: z.string().max(80),
  summary: z.string(),
  street_or_area: z.string(),
  category: z.enum([
    "Transit",
    "DevApp",
    "Safety",
    "Social",
    "Cost",
    "Weather",
    "Other",
  ]),
  impact: z.object({
    safety: z.number().int().min(0).max(5),
    cost: z.number().int().min(0).max(5),
    time: z.number().int().min(0).max(5),
  }),
  risk_score: z.number().int().min(0).max(10),
  auto_publish_eligible: z.boolean(),
});

// ─── Gemini client ────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY env var is not set");
  return new GoogleGenAI({ apiKey });
}

// ─── System instruction ───────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are an editorial assistant for Neighbours Club, a hyperlocal community newsletter serving Kanata, Ottawa, Ontario, Canada.

Your job is to read a raw news item and return a structured JSON object that summarises it for Kanata residents. The output must be neighbour-focused: emphasise practical impact on daily life (commute, safety, cost of living, local amenity) rather than political or bureaucratic framing.

CATEGORIES (pick exactly one):
- Transit     — OC Transpo route changes, road closures, construction affecting commutes
- DevApp      — development applications, rezoning, building permits, land-use proposals
- Safety      — crime reports, fire incidents, road hazards, health advisories
- Social      — community events, school news, local milestones, cultural happenings
- Cost        — utility rate changes, property tax, grocery/gas prices, local business openings/closures affecting household budgets
- Weather     — forecasts, severe weather warnings, seasonal advisories
- Other       — anything that does not fit the above

RISK SCORING RULES (risk_score 0–10, integer):
Apply the HIGHEST applicable rule:
1. Category is DevApp  → risk_score ≥ 6
2. Category is Safety  → risk_score ≥ 6
3. Content mentions a named person (politician, councillor, resident, business owner, developer) OR a named business/organization → risk_score ≥ 5
4. Content is about transit delays, road closures, weather, or community social events → risk_score 0–3
5. Anything else → use your judgement in the 3–5 range

auto_publish_eligible must be true if and only if risk_score ≤ 4.

OUTPUT FORMAT — return ONLY a JSON object with this exact shape, no prose:
{
  "headline": "<max 80 chars, present-tense, neighbour-focused>",
  "summary": "<2–3 sentences written for a Kanata resident, plain language, practical>",
  "street_or_area": "<most specific location mentioned, e.g. 'Terry Fox Dr', 'Kanata North', 'Hazeldean Mall', or 'Kanata' if no specific location>",
  "category": "<one of: Transit | DevApp | Safety | Social | Cost | Weather | Other>",
  "impact": {
    "safety": <integer 0–5>,
    "cost": <integer 0–5>,
    "time": <integer 0–5>
  },
  "risk_score": <integer 0–10>,
  "auto_publish_eligible": <true | false>
}`;

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Summarise a raw news item for the Neighbours Notes feed.
 *
 * @param rawText   Full text of the news item (scraped body, press release, etc.)
 * @param sourceUrl URL of the original source (included in the prompt for context)
 * @returns         Structured SummarizedNote ready for editorial review or auto-publish
 * @throws          If the API key is missing, the Gemini call fails, or the response
 *                  does not match the expected schema.
 */
export async function summarizeNewsItem(
  rawText: string,
  sourceUrl: string
): Promise<SummarizedNote> {
  const ai = getClient();

  const userPrompt = `Source URL: ${sourceUrl}

Raw news text:
${rawText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
    contents: userPrompt,
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini response was not valid JSON: ${raw.slice(0, 200)}`);
  }

  const result = SummarizedNoteSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Gemini response did not match expected schema: ${result.error.message}`
    );
  }

  return result.data as SummarizedNote;
}
