/** Keep the database ID stable while giving this venue its official public URL. */
export function destinationSlug(id: string): string {
  return id === "summit-cinema" ? "summit-auditorium" : id;
}

/** Hidden destinations remain unreachable, including through legacy URLs. */
export function findPublicDestination<T extends { id: string; active: boolean }>(
  destinations: readonly T[],
  id: string,
): T | undefined {
  const destinationId = id === "summit-auditorium" ? "summit-cinema" : id;
  return destinations.find((destination) => destination.active && destination.id === destinationId);
}
