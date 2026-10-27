// Money helpers: all arithmetic is done in integer cents.

/** "$1,060.00" -> 106000 */
export function parseMoney(text: string): number {
  const match = text.replace(/ /g, ' ').match(/\d[\d,]*\.\d{2}/);
  if (!match) throw new Error(`No money amount found in "${text}"`);
  return Math.round(parseFloat(match[0].replace(/,/g, '')) * 100);
}

/** 106000 -> "$1,060.00" (matches nopCommerce USD display) */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString('en-US');
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}$${dollars}.${rest}`;
}
