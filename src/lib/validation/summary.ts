import { z } from "zod";
import {
  LANGUAGE_CODES,
  SOURCE_TYPES,
  SUMMARY_LENGTHS,
  SUMMARY_MODES,
  SUMMARY_TONES,
} from "../summary-options";

export const MAX_TEXT_CHARS = 1_000_000;

const optionFields = {
  mode: z.enum(SUMMARY_MODES),
  length: z.enum(SUMMARY_LENGTHS).default("MEDIUM"),
  tone: z.enum(SUMMARY_TONES).default("NEUTRAL"),
  language: z.enum(LANGUAGE_CODES).default("en"),
};

export const summaryOptionsSchema = z.object(optionFields);
export type SummaryOptions = z.infer<typeof summaryOptionsSchema>;

/** Text and URL requests arrive as JSON. File requests are multipart and parsed separately. */
export const createSummaryJsonSchema = z.discriminatedUnion("sourceType", [
  z.object({
    sourceType: z.literal("TEXT"),
    text: z.string().min(1).max(MAX_TEXT_CHARS),
    ...optionFields,
  }),
  z.object({
    sourceType: z.literal("URL"),
    url: z.string().trim().min(1).max(2048),
    ...optionFields,
  }),
]);

export const listQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || undefined)
    .optional(),
  mode: z.enum(SUMMARY_MODES).optional(),
  source: z.enum(SOURCE_TYPES).optional(),
  favorite: z.enum(["true", "false"]).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const updateSummarySchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.isFavorite !== undefined, {
    message: "Nothing to update.",
  });

export const preferencesSchema = z.object({
  defaultMode: z.enum(SUMMARY_MODES),
  defaultLength: z.enum(SUMMARY_LENGTHS),
  defaultTone: z.enum(SUMMARY_TONES),
  outputLanguage: z.enum(LANGUAGE_CODES),
});

export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{10,40}$/);
