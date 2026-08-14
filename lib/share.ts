/** Build a wa.me deep link to a venue's WhatsApp with a prefilled message. Null if no number. */
export function waLink(number: string | null | undefined, text: string): string | null {
  if (!number) return null;
  const digits = number.replace(/[^\d]/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
