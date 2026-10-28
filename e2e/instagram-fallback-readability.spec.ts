import { fromCrossJSON, toCrossJSON } from "seroval";
import { expect, test } from "./fixtures";

test("account-prefixed karaoke reel shares reach the embed SDK as canonical permalinks", async ({
  page,
}) => {
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!response.headers()["server-timing"]?.includes("media;")) {
      await route.fulfill({ response });
      return;
    }
    const envelope = fromCrossJSON(await response.json(), {}) as { result: { posts: unknown[] } };
    envelope.result.posts = [
      {
        destination_id: "citron",
        post_url: "https://www.instagram.com/intercontinentaldanang/reel/DfBhhlvAGem/",
        embed_mode: "embed",
        account: null,
        caption: null,
        image_url: null,
        posted_at: null,
        display_order: 0,
      },
    ];
    await route.fulfill({ response, body: JSON.stringify(toCrossJSON(envelope)) });
  });
  await page.route("https://www.instagram.com/embed.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.instgrm={Embeds:{process(){
      document.querySelectorAll('blockquote.instagram-media').forEach(post=>{
        const frame=document.createElement('iframe');
        frame.title=post.dataset.instgrmPermalink;
        frame.style.cssText='display:block;width:100%;height:500px;border:0';
        frame.srcdoc='<p>Karaoke reel</p>';
        post.replaceWith(frame);
      });
    }}};`,
    }),
  );
  await page.goto("/citron");
  const post = page.locator(".instagram-post");
  await post.scrollIntoViewIfNeeded();
  await expect(post.locator("iframe")).toHaveAttribute(
    "title",
    "https://www.instagram.com/reel/DfBhhlvAGem/",
  );
  await expect(post.getByRole("link", { name: "VIEW ON INSTAGRAM", exact: true })).toHaveCount(0);
});

test("Instagram fallback captions stay readable with and without an account", async ({ page }) => {
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    if (!response.headers()["server-timing"]?.includes("media;")) {
      await route.fulfill({ response });
      return;
    }
    const envelope = fromCrossJSON(await response.json(), {}) as { result: { posts: unknown[] } };
    const media = envelope.result;
    media.posts = [true, false].map((withAccount, display_order) => ({
      destination_id: "citron",
      post_url: `https://www.instagram.com/p/CAPTION${display_order}/`,
      embed_mode: "link",
      account: withAccount ? "intercontinentaldanang" : null,
      caption: withAccount ? "A table above the bay." : "Views to remember.",
      image_url: null,
      posted_at: null,
      display_order,
    }));
    await route.fulfill({
      response,
      body: JSON.stringify(toCrossJSON(envelope)),
    });
  });
  await page.goto("/citron");
  const card = page.getByRole("dialog", { name: "Citron", exact: true });
  const posts = card.locator(".instagram-post article");
  await expect(posts).toHaveCount(2);
  for (const [index, caption] of ["A table above the bay.", "Views to remember."].entries()) {
    const post = posts.nth(index);
    await expect(post.locator("p")).toContainText(caption);
    expect(
      await post.locator("p").evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
    ).toBeCloseTo(13.65, 1);
    await expect(post.getByRole("link")).toHaveAttribute(
      "href",
      `https://www.instagram.com/p/CAPTION${index}/`,
    );
  }
  await expect(posts.nth(0).locator("p > span")).toHaveText("@intercontinentaldanang");
  await expect(posts.nth(1).locator("p > span")).toHaveCount(0);
  await expect(posts.nth(1).locator("header")).toContainText("instagram");
  await expect(card.locator(".instagram-post iframe")).toHaveCount(0);
});
