/** IDs are stable URL slugs from Supabase; hidden destinations must stay unreachable. */
export function findPublicDestination<T extends { id: string; active: boolean }>(
  destinations: readonly T[],
  id: string,
): T | undefined {
  return destinations.find((destination) => destination.active && destination.id === id);
}
