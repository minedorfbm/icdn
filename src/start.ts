import { getRequest } from "@tanstack/react-start/server";
import { requestLanguage } from "./i18n/preferred-language";
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { cspNonce } from "./lib/csp-nonce";

declare module "@tanstack/react-start" {
  interface Register {
    server: { requestContext: { nonce?: string } };
  }
}

const errorMiddleware = createMiddleware().server(async ({ next, context }) => {
  const nonce = cspNonce(context?.nonce);
  try {
    return await next({ context: { nonce } });
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(
      renderErrorPage(requestLanguage(getRequest().headers.get("accept-language")), nonce),
      {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
