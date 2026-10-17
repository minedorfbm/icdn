import { expect, test } from "./fixtures";

// Only the provider document is mocked. Real-device playback still needs a manual check.
const playerHtml = `<button onclick="document.body.dataset.playing='true'">YouTube Play</button>`;

test("La Maison prepares a native player without loading the JavaScript API or requesting autoplay", async ({
  page,
}, testInfo) => {
  let scripts = 0;
  await page.route("https://www.youtube.com/iframe_api", (route) => {
    scripts++;
    return route.abort();
  });
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) =>
    route.fulfill({ contentType: "text/html", body: playerHtml }),
  );
  await page.goto("/la-maison-1888");
  const card = page.getByRole("dialog", { name: "La Maison 1888", exact: true });
  const pilot = card.locator("[data-youtube-pilot]");
  await expect(pilot).toHaveCount(1);
  await expect(pilot.locator("iframe")).toHaveCount(0);
  await pilot.scrollIntoViewIfNeeded();
  const frame = pilot.locator("iframe");
  await expect(frame).toHaveAttribute("title", "Resort video");
  await expect(frame).toHaveAttribute("src", /autoplay=0&playsinline=1/);
  await expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  await expect(pilot.getByRole("button")).toHaveCount(0);
  const provider = page.frameLocator('iframe[title="Resort video"]');
  await provider.getByRole("button", { name: "YouTube Play", exact: true }).click();
  await expect(provider.locator("body")).toHaveAttribute("data-playing", "true");
  expect(scripts).toBe(0);
  await page.screenshot({ path: testInfo.outputPath("native-player.png") });
  await card.getByRole("button", { name: "BACK", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(0);
});

test("a slow native player is not covered by a hub error after twenty seconds", async ({
  page,
}) => {
  await page.clock.install();
  let releasePlayer: () => void = () => {};
  const waitForRelease = new Promise<void>((resolve) => {
    releasePlayer = resolve;
  });
  await page.route("https://www.youtube.com/iframe_api", (route) => route.abort());
  await page.route("https://www.youtube-nocookie.com/embed/**", async (route) => {
    await waitForRelease;
    await route.fulfill({ contentType: "text/html", body: playerHtml });
  });
  await page.goto("/la-maison-1888");
  const card = page.getByRole("dialog", { name: "La Maison 1888", exact: true });
  const pilot = card.locator("[data-youtube-pilot]");
  await pilot.scrollIntoViewIfNeeded();
  await expect(pilot.locator("iframe")).toHaveCount(1);
  await page.clock.fastForward(25_000);
  await expect(card.getByText("Content is temporarily unavailable.", { exact: true })).toHaveCount(
    0,
  );
  await expect(card.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(
    card.getByRole("link", { name: "Play video · YouTube", exact: true }),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=PVN005yvGpY");
  releasePlayer();
  const provider = page.frameLocator('iframe[title="Resort video"]');
  await provider.getByRole("button", { name: "YouTube Play", exact: true }).click();
  await expect(provider.locator("body")).toHaveAttribute("data-playing", "true");
});
