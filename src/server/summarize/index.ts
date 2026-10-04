import { generateSummaryStream } from "../ai/gemini";
import { getEntitlement } from "../entitlements";
import { checkRateLimit } from "../rate-limit";
import { createSummaryService } from "./service";
import { prepareSource } from "./source";

export const summaryService = createSummaryService({
  generate: generateSummaryStream,
  rateLimit: checkRateLimit,
  getEntitlement,
  prepareSource,
});
