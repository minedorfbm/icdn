import { SEARCH_FILLERS, SEARCH_INTENTS, type SearchIntent } from "./search-intents";

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

/** One edit, including a swapped pair, restricted to meaningful Latin words. */
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
    if (
      query.length === word.length &&
      query[left] === word[right + 1] &&
      query[left + 1] === word[right]
    ) {
      left += 2;
      right += 2;
      continue;
    }
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
  /** Curated concepts or free-form synonyms, maintained alongside the destination. */
  keywords?: readonly string[];
}

const intentAliases = Object.fromEntries(
  Object.entries(SEARCH_INTENTS).map(([key, words]) => [
    key,
    [...new Set([key, ...words.split("|")].map(normalizeSearch))],
  ]),
) as Record<SearchIntent, string[]>;
const aliases = Object.entries(intentAliases)
  .flatMap(([intent, words]) => words.map((word) => ({ intent: intent as SearchIntent, word })))
  .sort((a, b) => b.word.length - a.word.length);
const fillers = new Set([...SEARCH_FILLERS].map(normalizeSearch));
const unspacedScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

function phrasePosition(text: string, phrase: string): number {
  // CJK searches often have no spaces; Latin/Cyrillic words still need boundaries.
  if (unspacedScript.test(phrase)) return text.indexOf(phrase);
  const position = ` ${text} `.indexOf(` ${phrase} `);
  return position < 0 ? -1 : position;
}

function queryParts(query: string) {
  let remaining = query;
  const intents = new Set<SearchIntent>();
  for (const { intent, word } of aliases) {
    let position = phrasePosition(remaining, word);
    while (position >= 0) {
      intents.add(intent);
      remaining = `${remaining.slice(0, position)} ${remaining.slice(position + word.length)}`;
      position = phrasePosition(remaining, word);
    }
  }
  const words = remaining.split(/\s+/).filter((word) => word && !fillers.has(word));
  const terms: string[] = [];
  for (const word of words) {
    // Expand only an unambiguous typo or prefix, so an unknown request cannot become a guess.
    const possible = new Set(
      aliases
        .filter((alias) =>
          /^[a-z]{4,}$/.test(word) && /^[a-z]+$/.test(alias.word)
            ? alias.word.startsWith(word) || nearWord(word, alias.word)
            : false,
        )
        .map((alias) => alias.intent),
    );
    if (possible.size === 1) intents.add([...possible][0]!);
    else terms.push(word);
  }
  return { intents: [...intents], terms };
}

/** AND across meaningful requirements; names rank ahead of curated intents and prose. */
export function searchEntries<T>(
  entries: readonly SearchEntry<T>[],
  query: string,
  collection: string,
) {
  const normalized = normalizeSearch(query);
  const { intents, terms } = queryParts(normalized);
  if (normalized && !intents.length && !terms.length) return [];
  return entries
    .filter((entry) => !collection || entry.collection === collection)
    .map((entry) => {
      const name = normalizeSearch(entry.name);
      const text = normalizeSearch(entry.text);
      const keywords = (entry.keywords ?? []).map(normalizeSearch);
      const intentScores = intents.map((intent) => {
        const words = intentAliases[intent];
        const curatedMatch = keywords.some((keyword) =>
          words.some((word) => phrasePosition(keyword, word) >= 0),
        );
        // Curated profiles prevent incidental prose from inventing a mood or activity.
        if (keywords.length && !curatedMatch) return 0;
        if (words.some((word) => phrasePosition(name, word) >= 0)) return 30;
        if (curatedMatch) return 24;
        if (words.some((word) => phrasePosition(text, word) >= 0)) return 10;
        return 0;
      });
      const scores = [
        ...intentScores,
        ...terms.map((term) => {
          if (name.includes(term)) return 30;
          if (keywords.some((word) => word.includes(term))) return 20;
          if (text.includes(term)) return 10;
          if (name.split(" ").some((word) => nearWord(term, word))) return 1;
          return 0;
        }),
      ];
      const score =
        (normalized && name === normalized ? 1000 : 0) + scores.reduce<number>((a, b) => a + b, 0);
      return { entry, score, matches: name === normalized || scores.every((value) => value > 0) };
    })
    .filter((result) => result.matches)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}
