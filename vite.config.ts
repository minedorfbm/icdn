// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Only the dedicated test build loads instrumentation. Production stays untouched.
const browserCoverage = process.env["HUB_BROWSER_COVERAGE"] === "1";
const coveragePlugins = browserCoverage
  ? [
      (await import("vite-plugin-istanbul")).default({
        include: "src/**/*",
        forceBuildInstrument: true,
      }),
    ]
  : [];

export default defineConfig({
  plugins: coveragePlugins,
  vite: browserCoverage ? { build: { sourcemap: "hidden" } } : {},
  nitro: {
    preset: "cloudflare-module",
    cloudflare: { nodeCompat: true, deployConfig: true },
    ...(browserCoverage ? { output: { dir: ".output/browser-coverage" } } : {}),
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
