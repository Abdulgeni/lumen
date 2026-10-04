import { GoogleGenAI } from "@google/genai";
import type { ModelTier } from "@/lib/plans";
import { env } from "../../env";
import { type GenAiLike, streamSummary } from "./stream";

let client: GoogleGenAI | undefined;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));

export function modelsForTier(tier: ModelTier) {
  return {
    primary: tier === "lite" ? env.GEMINI_MODEL_LITE : env.GEMINI_MODEL_STANDARD,
    fallback: env.GEMINI_MODEL_FALLBACK,
  };
}

export function generateSummaryStream(params: {
  tier: ModelTier;
  systemInstruction: string;
  userContent: string;
  signal?: AbortSignal | undefined;
}) {
  return streamSummary(
    // Structural subset of the SDK; scripts/gemini-check.ts verifies it against the real API.
    getClient() as unknown as GenAiLike,
    {
      models: modelsForTier(params.tier),
      systemInstruction: params.systemInstruction,
      userContent: params.userContent,
      signal: params.signal,
    },
  );
}
