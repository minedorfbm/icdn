/** Keep the database ID stable while giving this venue its official public URL. */
export function destinationSlug(id: string): string {
  return id === "summit-cinema" ? "summit-auditorium" : id;
}

/** Resolve official and legacy public URLs without requesting the catalogue. */
export function canonicalDestinationId(slug: string): string {
  return slug === "summit-auditorium"
    ? "summit-cinema"
    : slug === "nature-discovery-guide"
      ? "nature-experiences"
      : slug;
}

export function findPublicDestination<T extends { id: string; active: boolean }>(
  destinations: readonly T[],
  id: string,
): T | undefined {
  const destinationId = canonicalDestinationId(id);
  return destinations.find((destination) => destination.active && destination.id === destinationId);
}
