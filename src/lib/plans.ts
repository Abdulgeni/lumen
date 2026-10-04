import { MODE_LABELS, type SourceType, type SummaryMode } from "./summary-options";

export const PLAN_IDS = ["free", "pro", "team"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export type ModelTier = "lite" | "standard";

export type PlanConfig = {
  id: PlanId;
  name: string;
  monthlySummaries: number;
  maxInputWords: number;
  /** 0 means file uploads are not available. */
  maxFileBytes: number;
  modes: readonly SummaryMode[];
  sources: readonly SourceType[];
  modelTier: ModelTier;
};

const MB = 1024 * 1024;

const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlySummaries: 10,
    maxInputWords: 5_000,
    maxFileBytes: 0,
    modes: ["EXECUTIVE_BRIEF", "KEY_POINTS"],
    sources: ["TEXT", "URL"],
    modelTier: "lite",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlySummaries: 300,
    maxInputWords: 50_000,
    maxFileBytes: 4 * MB,
    modes: ["EXECUTIVE_BRIEF", "KEY_POINTS", "DEEP_DIVE"],
    sources: ["TEXT", "URL", "FILE"],
    modelTier: "standard",
  },
  team: {
    id: "team",
    name: "Team",
    monthlySummaries: 1_500,
    maxInputWords: 150_000,
    maxFileBytes: 4 * MB,
    modes: ["EXECUTIVE_BRIEF", "KEY_POINTS", "DEEP_DIVE"],
    sources: ["TEXT", "URL", "FILE"],
    modelTier: "standard",
  },
};

export function getPlan(id: PlanId): PlanConfig {
  return PLANS[id];
}

export type EntitlementViolation = {
  code: "SOURCE_NOT_ALLOWED" | "MODE_NOT_ALLOWED" | "INPUT_TOO_LONG" | "FILE_TOO_LARGE";
  message: string;
  /** The cheapest plan that would allow this request, for upgrade prompts. */
  upgradeTo: PlanId | null;
};

export type SummaryRequestShape = {
  mode: SummaryMode;
  sourceType: SourceType;
  inputWords: number;
  fileBytes?: number;
};

function cheapestPlanThat(predicate: (plan: PlanConfig) => boolean): PlanId | null {
  return PLAN_IDS.find((id) => predicate(PLANS[id])) ?? null;
}

export function checkEntitlements(
  planId: PlanId,
  request: SummaryRequestShape,
): EntitlementViolation | null {
  const plan = getPlan(planId);

  if (!plan.sources.includes(request.sourceType)) {
    return {
      code: "SOURCE_NOT_ALLOWED",
      message: "File uploads are available on paid plans.",
      upgradeTo: cheapestPlanThat((p) => p.sources.includes(request.sourceType)),
    };
  }
  if (!plan.modes.includes(request.mode)) {
    return {
      code: "MODE_NOT_ALLOWED",
      message: `${MODE_LABELS[request.mode]} is available on paid plans.`,
      upgradeTo: cheapestPlanThat((p) => p.modes.includes(request.mode)),
    };
  }
  if (request.fileBytes !== undefined && request.fileBytes > plan.maxFileBytes) {
    return {
      code: "FILE_TOO_LARGE",
      message: `Files can be up to ${Math.floor(plan.maxFileBytes / MB)} MB on your plan.`,
      upgradeTo: cheapestPlanThat((p) => p.maxFileBytes >= (request.fileBytes ?? 0)),
    };
  }
  if (request.inputWords > plan.maxInputWords) {
    return {
      code: "INPUT_TOO_LONG",
      message: `This input has ${request.inputWords.toLocaleString("en-US")} words. Your plan allows ${plan.maxInputWords.toLocaleString("en-US")}.`,
      upgradeTo: cheapestPlanThat((p) => p.maxInputWords >= request.inputWords),
    };
  }
  return null;
}

/** The next tier up, used for upgrade prompts. */
export function nextPlan(id: PlanId): PlanId | null {
  return PLAN_IDS[PLAN_IDS.indexOf(id) + 1] ?? null;
}
