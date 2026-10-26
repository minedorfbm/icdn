type CatalogueRequest = { url: string; started: number; response: Promise<Response> };

declare global {
  interface Window {
    __adjCatalogue?: CatalogueRequest;
    __adjCatalogueStarted?: boolean;
  }
}

/** The framework applies the response's CSP nonce to this head script. Only the
 * generated same-origin server-function URL is embedded, never catalogue data. */
export function catalogueBootstrap(url: string): string {
  const encoded = JSON.stringify(url).replaceAll("<", "\\u003c");
  return `if(!window.__adjCatalogueStarted){window.__adjCatalogueStarted=true;var r=fetch(${encoded},{priority:"low"});r.catch(function(){});window.__adjCatalogue={url:${encoded},started:Date.now(),response:r};}`;
}

/** Consume the early request once. A retry or a later visit uses a fresh read;
 * the bootstrap never lengthens the existing 30-second browser cache window. */
export function takeCatalogueRequest(url: string): CatalogueRequest | undefined {
  if (typeof window === "undefined") return undefined;
  const request = window.__adjCatalogue;
  delete window.__adjCatalogue;
  const age = request ? Date.now() - request.started : -1;
  return request?.url === url && age >= 0 && age < 30_000 ? request : undefined;
}
