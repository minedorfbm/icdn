/** Keep the database ID stable while giving this venue its official public URL. */
export function destinationSlug(id: string): string {
  return id === "summit-cinema" ? "summit-auditorium" : id;
}

/** Resolve official and legacy public URLs without requesting the catalogue. */
export function canonicalDestinationId(slug: string): string {
  if (slug === "summit-auditorium") return "summit-cinema";
  if (slug === "nature-discovery-guide") return "nature-experiences";
  return slug;
}

export function findPublicDestination<T extends { id: string; active: boolean }>(
  destinations: readonly T[],
  id: string,
): T | undefined {
  const destinationId = canonicalDestinationId(id);
  return destinations.find((destination) => destination.active && destination.id === destinationId);
}
