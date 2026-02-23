/**
 * Format a price string to a rounded whole number with no decimals.
 * e.g. "₹1299.50" → "₹1300", "1299.99" → "₹1300"
 */
export function formatRoundedPrice(priceStr: string | null | undefined): string | null {
  if (priceStr == null || priceStr === "") return null;
  const match = priceStr.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return priceStr;
  const num = parseFloat(match[1]);
  const rounded = Math.round(num);
  return `₹${rounded}`;
}
