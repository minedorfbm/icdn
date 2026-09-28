export const SEARCH_COLLECTIONS = ["DINING", "WELLNESS", "EXPERIENCES"] as const;
export type SearchCollection = (typeof SEARCH_COLLECTIONS)[number];

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll("đ", "d")
    .replaceAll("_", "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** One insertion, deletion or substitution, restricted to meaningful Latin words. */
function nearWord(query: string, word: string): boolean {
  if (!/^[a-z]{4,}$/.test(query) || Math.abs(query.length - word.length) > 1) return false;
  let left = 0;
  let right = 0;
  let edits = 0;
  while (left < query.length && right < word.length) {
    if (query[left] === word[right]) {
      left++;
      right++;
      continue;
    }
    if (++edits > 1) return false;
    if (query.length >= word.length) left++;
    if (word.length >= query.length) right++;
  }
  return edits + (query.length - left) + (word.length - right) <= 1;
}

export interface SearchEntry<T> {
  item: T;
  name: string;
  text: string;
  collection: string;
}

/** AND across query terms; exact names rank above descriptions and typo matches. */
export function searchEntries<T>(
  entries: readonly SearchEntry<T>[],
  query: string,
  collection: string,
) {
  const normalized = normalizeSearch(query);
  const terms = normalized.split(" ").filter(Boolean);
  return entries
    .filter((entry) => !collection || entry.collection === collection)
    .map((entry) => {
      const name = normalizeSearch(entry.name);
      const text = normalizeSearch(entry.text);
      const scores = terms.map((term) => {
        if (name.includes(term)) return 30;
        if (text.includes(term)) return 10;
        if (name.split(" ").some((word) => nearWord(term, word))) return 1;
        return 0;
      });
      const score =
        (normalized && name === normalized ? 100 : 0) + scores.reduce<number>((a, b) => a + b, 0);
      return { entry, score, matches: scores.every((value) => value > 0) };
    })
    .filter((result) => result.matches)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}
