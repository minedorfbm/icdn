import { expect, test } from "./fixtures";
import images from "../src/data/image-variants.json" with { type: "json" };
import { HERO_DESKTOP_MEDIA } from "../src/lib/hero-media";

const hero =
  images[
    "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/adj-ac8d45688b7edb5bf37d68e3-native.webp"
  ];
const names = new Set(
  [...hero.variants, ...hero.avifVariants, hero.avif].map((image) =>
    new URL(image.src).pathname.split("/").at(-1),
  ),
);

for (const screen of [
  { width: 1440, height: 900, dpr: 1, hd: true },
  { width: 1440, height: 900, dpr: 2, hd: true },
  { width: 2560, height: 1080, dpr: 1, hd: true },
  { width: 390, height: 844, dpr: 3, hd: false },
  { width: 834, height: 1194, dpr: 2, hd: false },
  { width: 1024, height: 768, dpr: 2, hd: false },
]) {
  test.describe(`desktop photo at ${screen.width}px / DPR ${screen.dpr}`, () => {
    test.use({
      viewport: { width: screen.width, height: screen.height },
      deviceScaleFactor: screen.dpr,
    });
    test("preloads one fitting compressed photo without transferring the master or other formats", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (request) => requests.push(request.url()));
      await page.goto("/");
      await expect(page.locator("#heaven")).toBeAttached();
      const photo = page.locator(".threshold-img");
      await expect
        .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
        .toBe(true);
      const selected = await photo.evaluate((img: HTMLImageElement) => img.currentSrc);
      const hdRequests = requests.filter((url) =>
        names.has(new URL(url).pathname.split("/").at(-1)),
      );
      expect(
        requests.some((url) => url.includes("adj-0f78b754bd10acded9be37bb-original.png")),
      ).toBe(false);
      if (!screen.hd) {
        expect(hdRequests).toEqual([]);
        return;
      }
      expect(hdRequests).toEqual([selected]);
      const expectedWidth =
        screen.width === 1440 && screen.dpr === 1 ? 1920 : screen.dpr === 2 ? 3840 : 2560;
      expect(selected).toContain(`-${expectedWidth}.avif`);
      const preload = page.locator(`link[rel="preload"][media="${HERO_DESKTOP_MEDIA}"]`);
      await expect(preload).toHaveAttribute("imagesrcset", new RegExp(new URL(selected).pathname));
      await expect(photo).toHaveAttribute("fetchpriority", "high");
      await expect(photo).toHaveCSS("animation-name", "none");
      await expect(photo).toHaveCSS("transform", "none");
      await page.goto("/citron");
      expect(await page.locator(`link[rel="preload"][media="${HERO_DESKTOP_MEDIA}"]`).count()).toBe(
        0,
      );
    });
  });
}
