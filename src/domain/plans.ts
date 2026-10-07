const GIB = 1024 ** 3;

export type Plan = {
  code: "free" | "plus" | "pro";
  name: string;
  quotaBytes: number;
  tagline: string;
};

/**
 * The plans. A church's plan is its media quota (`church.storage.quotaBytes`),
 * so the contract needs no extra field. The API has the same catalog in
 * `src/modules/church/plans.ts`: change a value in both.
 */
export const PLANS: readonly Plan[] = [
  { code: "free", name: "Gratis", quotaBytes: 5 * GIB, tagline: "Para empezar" },
  { code: "plus", name: "Plus", quotaBytes: 15 * GIB, tagline: "Para iglesias activas" },
  { code: "pro", name: "Pro", quotaBytes: 50 * GIB, tagline: "Para mucho material" },
];

/** The plan whose quota matches, or null for a quota set by hand. */
export function planForQuota(quotaBytes: number): Plan | null {
  return PLANS.find((plan) => plan.quotaBytes === quotaBytes) ?? null;
}
