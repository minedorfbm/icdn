import { z } from "zod";

// Configure before creating schemas: even Zod's eval capability probe triggers
// a CSP violation. The runtime validator keeps the same checks without code generation.
// package.json preserves this initialization when bundling re-exported imports.
z.config({ jitless: true });

export { z };
