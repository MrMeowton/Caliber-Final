// Gemini JSON helper. Returns null when AI is unavailable (no key, AI_FALLBACK_ONLY, timeout, all models failed)
// so every caller must have a rule-based fallback.
import { GoogleGenAI, type Schema } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  ...(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-flash-lite-latest,gemini-2.5-flash")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
];

export async function generateJson<T>(args: {
  system: string;
  prompt: string;
  schema: Schema;
  timeoutMs?: number;
}): Promise<{ data: T; model: string } | null> {
  if (!API_KEY || process.env.AI_FALLBACK_ONLY === "true") return null;
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const deadline = Date.now() + (args.timeoutMs ?? 25_000);

  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      const res = await Promise.race([
        ai.models.generateContent({
          model,
          contents: args.prompt,
          config: {
            systemInstruction: args.system,
            responseMimeType: "application/json",
            responseSchema: args.schema,
            temperature: 0.2,
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), remaining)),
      ]);
      if (res.text) return { data: JSON.parse(res.text) as T, model };
    } catch (e) {
      console.warn(`[ai] ${model} failed:`, (e as Error).message);
    }
  }
  return null;
}
