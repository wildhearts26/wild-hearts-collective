/** Whole-credit display helpers. Balances and costs are stored as floats (e.g. 1.5). */

export const DEFAULT_CREDIT_COST = 1;

/** @deprecated Refunds no longer convert cash to credits at this rate. Kept for legacy reference. */
export const PENCE_PER_CREDIT = 1000;

/** @deprecated Use resolveBookingRefundCredits instead. */
export function penceToCredits(pence: number) {
  if (!Number.isFinite(pence) || pence <= 0) return 0;
  return Math.round((pence / PENCE_PER_CREDIT) * 100) / 100;
}

export function formatCredits(amount: number) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

export function formatCreditLabel(amount: number) {
  const formatted = formatCredits(amount);
  return Number(formatted) === 1 ? "1 class credit" : `${formatted} class credits`;
}

/** Parse a credit amount to 2 decimal places. Returns NaN when invalid. */
export function parseCreditAmount(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number.parseFloat(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) return Number.NaN;
  return Math.round(parsed * 100) / 100;
}

export function parseCreditInput(value: unknown, fallback = DEFAULT_CREDIT_COST) {
  const parsed = parseCreditAmount(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function hasEnoughCredits(balance: number, cost: number) {
  return Number(balance) + 1e-9 >= Number(cost);
}
