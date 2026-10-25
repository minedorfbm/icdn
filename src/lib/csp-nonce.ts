/** Fresh 128-bit script authorization for one response; never retained in a cache. */
export function createCspNonce(): string {
  return btoa(String.fromCodePoint(...crypto.getRandomValues(new Uint8Array(16))));
}

/** Only accept the format generated above when reading request context or writing HTML. */
export function cspNonce(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9+/]{22}==$/.test(value) ? value : undefined;
}
