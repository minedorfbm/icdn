import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { nativeInstagramPost } from "../src/data/native-instagram-posts";
import { LANGUAGES } from "../src/i18n/dictionary";

describe("curated native Instagram posts", () => {
  test("resolves approved carousels with real assets and all translations", () => {
    for (const [code, count] of [
      ["DGwwT3cCPE5", 3],
      ["DL9jFzytrOp", 2],
      ["DMPkp9hM_nP", 2],
    ] as const) {
      const post = nativeInstagramPost(`https://www.instagram.com/p/${code}/?img_index=2`)!;
      expect(post.images).toHaveLength(count);
      for (const image of post.images) expect(existsSync(`public${image}`)).toBe(true);
      for (const { code: lang } of LANGUAGES)
        expect(post.captions[lang].length).toBeGreaterThan(30);
    }
  });
  test("does not replace working embeds or incomplete video posts", () => {
    for (const code of ["DTkauDdEt51", "DdQWW42D91g", "DFfKmy2O0Bt"]) {
      expect(nativeInstagramPost(`https://www.instagram.com/p/${code}/`)).toBeUndefined();
    }
    expect(nativeInstagramPost("https://example.com/p/DGwwT3cCPE5/")).toBeUndefined();
  });
});
