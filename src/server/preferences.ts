import { db } from "./db";

export const DEFAULT_PREFERENCES = {
  defaultMode: "EXECUTIVE_BRIEF",
  defaultLength: "MEDIUM",
  defaultTone: "NEUTRAL",
  outputLanguage: "en",
} as const;

const select = {
  defaultMode: true,
  defaultLength: true,
  defaultTone: true,
  outputLanguage: true,
} as const;

export async function getPreferences(userId: string) {
  const row = await db.userPreference.findUnique({ where: { userId }, select });
  return row ?? DEFAULT_PREFERENCES;
}

export function savePreferences(
  userId: string,
  data: {
    defaultMode: "EXECUTIVE_BRIEF" | "KEY_POINTS" | "DEEP_DIVE";
    defaultLength: "SHORT" | "MEDIUM" | "LONG";
    defaultTone: "NEUTRAL" | "PROFESSIONAL" | "CONVERSATIONAL" | "ACADEMIC";
    outputLanguage: string;
  },
) {
  return db.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select,
  });
}
