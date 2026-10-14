import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

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
