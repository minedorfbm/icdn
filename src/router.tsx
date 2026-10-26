import { createRouter } from "@tanstack/react-router";
import { NotFoundPage } from "./components/NotFoundPage";
import { routeTree } from "./routeTree.gen";
import { getGlobalStartContext } from "@tanstack/react-start";
import { cspNonce } from "./lib/csp-nonce";

export const getRouter = () => {
  const nonce = cspNonce(getGlobalStartContext()?.nonce);
  const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Start restores this from its CSP meta tag during browser hydration.
    ssr: nonce ? { nonce } : {},
  });

  return router;
};
