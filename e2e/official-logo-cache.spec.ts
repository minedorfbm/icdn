import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";

const file = "adj-f7a1a68f80f2abaac5654cf7-original.svg";
const artwork = readFileSync(new URL("../tests/fixtures/official-logo-black.svg", import.meta.url));

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`the cached official logo preserves its gold emblem at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.route(`**/media/${file}`, (route) =>
      route.fulfill({
        body: artwork,
        headers: {
          "content-type": "image/svg+xml",
          "content-security-policy":
            "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
        },
      }),
    );
    const logos: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(file)) logos.push(request.url());
    });
    await page.goto("/");
    const logo = page.locator(".hero-resort-logo:visible");
    await expect(logo).toHaveAttribute("src", `/media/${file}`);
    await expect
      .poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    const goldPixels = await logo.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 615;
      canvas.height = 192;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let gold = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (
          pixels[i + 3]! > 200 &&
          pixels[i]! > 100 &&
          pixels[i]! > pixels[i + 2]! * 1.15 &&
          pixels[i + 1]! > 70
        )
          gold++;
      }
      return gold;
    });
    expect(goldPixels).toBeGreaterThan(100);
    expect(logos).toEqual([new URL(`/media/${file}`, page.url()).href]);
  });
}
