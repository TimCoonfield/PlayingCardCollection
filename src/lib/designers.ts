const CONFIDENT_SEPARATOR = /\s+\/\s+/;
const AMBIGUOUS_SEPARATOR = /(?:\s+&\s+|\s+and\s+|\s*[,;+]\s*)/i;

/**
 * Splits only the legacy credit format whose meaning is consistent in this archive.
 * Ampersands deliberately remain intact because values such as "Dan & Dave" are shared identities.
 */
export function splitLegacyDesignerCredit(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return uniqueDesignerNames(value.split(CONFIDENT_SEPARATOR));
}

export function uniqueDesignerNames(values: Iterable<string>): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const name = value.trim();
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export function joinDesignerNames(values: Iterable<string>): string | null {
  const names = uniqueDesignerNames(values);
  return names.length > 0 ? names.join(" / ") : null;
}

export function needsDesignerReview(value: string): boolean {
  return !CONFIDENT_SEPARATOR.test(value) && AMBIGUOUS_SEPARATOR.test(value);
}
