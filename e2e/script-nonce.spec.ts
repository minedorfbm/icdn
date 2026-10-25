import { expect, test } from "./fixtures";

function responseNonce(policy: string) {
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  return nonce!;
}

test("simultaneous HTML responses authorize only their own scripts and cannot enter a shared cache", async ({
  request,
}) => {
  const responses = await Promise.all([request.get("/"), request.get("/citron")]);
  const nonces: string[] = [];
  for (const response of responses) {
    expect(response.ok()).toBe(true);
    const policy = response.headers()["content-security-policy"]!;
    const nonce = responseNonce(policy);
    nonces.push(nonce);
    const scripts = (await response.text()).match(/<script\b[^>]*>/g)!;
    expect(scripts.length).toBeGreaterThan(1);
    for (const script of scripts) expect(script).toContain(`nonce="${nonce}"`);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(policy.split(";").find((part) => part.trim().startsWith("script-src "))).not.toContain(
      "'unsafe-inline'",
    );
  }
  expect(nonces[0]).not.toBe(nonces[1]);
});

test("hydration, client navigation and refresh keep the document nonce without script errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  const response = (await page.goto("/"))!;
  const nonce = responseNonce(response.headers()["content-security-policy"]!);
  await expect(page.locator('meta[property="csp-nonce"]')).toHaveAttribute("content", nonce);
  await page.locator("#heaven").getByRole("button", { name: "Citron", exact: true }).click();
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator('meta[property="csp-nonce"]')).toHaveAttribute("content", nonce);
  const refreshed = (await page.reload())!;
  const nextNonce = responseNonce(refreshed.headers()["content-security-policy"]!);
  expect(nextNonce).not.toBe(nonce);
  await expect(page.locator(".editorial-title")).toHaveText("Citron");
  await expect(page.locator('meta[property="csp-nonce"]')).toHaveAttribute("content", nextNonce);
  expect(errors).toEqual([]);
});

test("an unmarked inline script and a script reusing another response's nonce are blocked", async ({
  page,
  request,
}) => {
  const first = await request.get("/");
  const policy = first.headers()["content-security-policy"]!;
  const nonce = responseNonce(policy);
  const other = responseNonce((await request.get("/")).headers()["content-security-policy"]!);
  await page.route("**/nonce-execution-check", (route) =>
    route.fulfill({
      headers: { "content-type": "text/html", "content-security-policy": policy },
      body: `<!doctype html><html><body>
        <script nonce="${nonce}">
          document.addEventListener('securitypolicyviolation', event => {
            const output = document.createElement('output');
            output.textContent = event.effectiveDirective;
            document.body.append(output);
          });
          document.body.append('Authorized recovery script ran');
        </script>
        <script>document.body.append('Unmarked script ran');</script>
        <script nonce="${other}">document.body.append('Reused nonce ran');</script>
      </body></html>`,
    }),
  );
  await page.goto("/nonce-execution-check");
  await expect(page.locator("body")).toContainText("Authorized recovery script ran");
  await expect(page.locator("output")).toHaveCount(2);
  // Text content of rejected script nodes remains in the DOM; inspect visible text.
  const visible = await page.locator("body").innerText();
  expect(visible).not.toContain("Unmarked script ran");
  expect(visible).not.toContain("Reused nonce ran");
});
