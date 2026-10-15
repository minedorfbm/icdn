import { expect, test } from "./fixtures";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

test("cards and benefits validate without dynamic evaluation under the candidate policy", async ({
  page,
}) => {
  const violations: unknown[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.exposeFunction("recordPolicyViolation", (report: unknown) => violations.push(report));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      if (event.blockedURI !== "eval") return;
      (
        window as unknown as {
          recordPolicyViolation: (report: unknown) => void;
        }
      ).recordPolicyViolation({ directive: event.effectiveDirective, file: event.sourceFile });
    });
  });
  // Exercise the real application under the candidate, without live provider dependencies.
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route("http://127.0.0.1:4173/**", async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    const headers = response.headers();
    const candidate = headers["content-security-policy-report-only"];
    expect(candidate).toBeTruthy();
    headers["content-security-policy"] += `, ${candidate}`;
    delete headers["content-security-policy-report-only"];
    return route.fulfill({ response, headers });
  });
  await page.goto("/rooms");
  await page.getByRole("button", { name: "Benefits", exact: true }).click();
  const benefits = page.getByRole("dialog", {
    name: "Resort Classic Room Oceanview · Benefits",
    exact: true,
  });
  await expect(benefits.getByRole("listitem")).toHaveCount(9);
  await benefits.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto("/citron");
  await expect(page.getByRole("dialog", { name: "Citron", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Test video/ })).toBeVisible();
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("the candidate Worker policy restricts scripts and requests while allowing providers and local data", async ({
  page,
  request,
}) => {
  // Exercise the report-only candidate as an enforced policy in this isolated page.
  const policy = (await request.get("/")).headers()["content-security-policy-report-only"]!;
  let unexpectedRequests = 0;
  await page.route("https://unapproved.example/**", (route) => {
    unexpectedRequests++;
    return route.fulfill({ body: "Unexpected request" });
  });
  for (const host of ["www.instagram.com", "www.youtube.com"]) {
    await page.route(`https://${host}/security-check.js`, (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `document.body.append("${host} loaded");`,
      }),
    );
  }
  await page.route("**/security-local-data", (route) =>
    route.fulfill({ body: "Local data loaded" }),
  );
  await page.route("**/security-resource-check", (route) =>
    route.fulfill({
      headers: { "content-type": "text/html", "content-security-policy": policy },
      body: `<!doctype html><html><body>
      <script>
        document.addEventListener('securitypolicyviolation', event => {
          const result = document.createElement('output');
          result.textContent = event.effectiveDirective + ':' + event.blockedURI;
          document.body.append(result);
        });
        fetch('/security-local-data').then(r => r.text()).then(text => document.body.append(text));
        fetch('https://unapproved.example/data').catch(() => {});
        try { new Function('document.body.append("Unsafe evaluation executed")')(); } catch {}
      </script>
      <script src="https://www.instagram.com/security-check.js"></script>
      <script src="https://www.youtube.com/security-check.js"></script>
      <script src="https://unapproved.example/script.js"></script>
    </body></html>`,
    }),
  );
  await page.goto("/security-resource-check");
  await expect(page.locator("body")).toContainText("www.instagram.com loaded");
  await expect(page.locator("body")).toContainText("www.youtube.com loaded");
  await expect(page.locator("body")).toContainText("Local data loaded");
  await expect(page.locator("output", { hasText: "connect-src:" })).toHaveCount(1);
  await expect(
    page.locator("output", { hasText: "https://unapproved.example/script.js" }),
  ).toHaveCount(1);
  await expect(page.locator("output", { hasText: "eval" })).toHaveCount(1);
  expect(unexpectedRequests).toBe(0);
});

test("the actual fallback error page can retry under the Worker policy", async ({
  page,
  request,
}) => {
  const policy = (await request.get("/")).headers()["content-security-policy"]!;
  // Load the actual renderer and its JSON dictionaries with the project's Bun runtime.
  const errorHtml = execFileSync(
    "bun",
    [
      "-e",
      'import { renderErrorPage } from "./src/lib/error-page.ts"; process.stdout.write(renderErrorPage("en"));',
    ],
    { cwd: resolve(import.meta.dirname, ".."), encoding: "utf8" },
  );
  let loads = 0;
  await page.route("**/csp-error-page", (route) => {
    loads++;
    return route.fulfill({
      status: loads === 1 ? 500 : 200,
      headers: { "content-type": "text/html", "content-security-policy": policy },
      body: loads === 1 ? errorHtml : "<p>Recovered</p>",
    });
  });
  await page.goto("/csp-error-page");
  await page.locator("#error-retry").click();
  await expect(page.getByText("Recovered", { exact: true })).toBeVisible();
  expect(loads).toBe(2);
});

test("the Worker policy allows approved embeds and blocks an unknown frame and inline handlers", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  const policy = response.headers()["content-security-policy"]!;
  expect(policy).toContain("frame-src");
  const hosts = [
    "www.instagram.com",
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "www.danang.intercontinental.com",
    "www.tablecheck.com",
  ];
  for (const host of hosts) {
    await page.route(`https://${host}/csp-test`, (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>Embed allowed</p>" }),
    );
  }
  let unknownRequests = 0;
  await page.route("https://unapproved.example/csp-test", (route) => {
    unknownRequests++;
    return route.fulfill({ contentType: "text/html", body: "Unexpected frame" });
  });
  await page.route("**/csp-test-page", (route) =>
    route.fulfill({
      headers: { "content-type": "text/html", "content-security-policy": policy },
      body: `<!doctype html><html><body>
      <script>document.addEventListener('securitypolicyviolation', e => {
        const p = document.createElement('p'); p.className = 'violation';
        p.textContent = e.effectiveDirective; document.body.append(p);
      });</script>
      <button onclick="this.textContent='Executed'">Inline handler</button>
      ${hosts.map((host) => `<iframe title="${host}" src="https://${host}/csp-test"></iframe>`).join("")}
      <iframe title="Unknown provider" src="https://unapproved.example/csp-test"></iframe>
      </body></html>`,
    }),
  );
  await page.goto("/csp-test-page");
  for (const host of hosts)
    await expect(
      page.frameLocator(`iframe[title="${host}"]`).getByText("Embed allowed"),
    ).toBeVisible();
  await expect(page.locator(".violation", { hasText: "frame-src" })).toHaveCount(1);
  expect(unknownRequests).toBe(0);
  await page.getByRole("button", { name: "Inline handler" }).click();
  await expect(page.locator(".violation", { hasText: "script-src-attr" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Inline handler" })).toBeVisible();
});
