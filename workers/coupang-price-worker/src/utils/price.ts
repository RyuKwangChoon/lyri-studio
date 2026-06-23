export function normalizePrice(input: string | null | undefined): number | null {
  if (!input) return null;
  const digits = input.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function diffRate(prevPrice: number, todayPrice: number): number {
  if (!prevPrice) return 0;
  return Math.round(((todayPrice - prevPrice) / prevPrice) * 10000) / 100;
}
