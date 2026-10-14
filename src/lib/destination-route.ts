/** Keep the database ID stable while giving this venue its official public URL. */
export function destinationSlug(id: string): string {
  return id === "summit-cinema" ? "summit-auditorium" : id;
}

/** Hidden destinations remain unreachable, including through legacy URLs. */
export function findPublicDestination<T extends { id: string; active: boolean }>(
  destinations: readonly T[],
  id: string,
): T | undefined {
  let destinationId = id;
  if (id === "summit-auditorium") destinationId = "summit-cinema";
  else if (id === "nature-discovery-guide") destinationId = "nature-experiences";
  return destinations.find((destination) => destination.active && destination.id === destinationId);
}
