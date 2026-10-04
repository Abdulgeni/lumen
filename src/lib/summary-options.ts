export const SUMMARY_MODES = ["EXECUTIVE_BRIEF", "KEY_POINTS", "DEEP_DIVE"] as const;
export const SUMMARY_LENGTHS = ["SHORT", "MEDIUM", "LONG"] as const;
export const SUMMARY_TONES = ["NEUTRAL", "PROFESSIONAL", "CONVERSATIONAL", "ACADEMIC"] as const;
export const SOURCE_TYPES = ["TEXT", "URL", "FILE"] as const;

export type SummaryMode = (typeof SUMMARY_MODES)[number];
export type SummaryLength = (typeof SUMMARY_LENGTHS)[number];
export type SummaryTone = (typeof SUMMARY_TONES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export const MODE_LABELS: Record<SummaryMode, string> = {
  EXECUTIVE_BRIEF: "Executive Brief",
  KEY_POINTS: "Key Points",
  DEEP_DIVE: "Deep Dive",
};

export const OUTPUT_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "id", name: "Indonesian" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
] as const;

export type LanguageCode = (typeof OUTPUT_LANGUAGES)[number]["code"];
export const LANGUAGE_CODES = OUTPUT_LANGUAGES.map((l) => l.code) as unknown as readonly [
  LanguageCode,
  ...LanguageCode[],
];

export function languageName(code: string): string {
  return OUTPUT_LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}
