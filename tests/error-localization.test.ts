import { describe, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { LANGUAGES, UI } from "../src/i18n/dictionary";
import { preferredLanguage, requestLanguage } from "../src/i18n/preferred-language";
import { renderErrorPage } from "../src/lib/error-page";

describe("language recovery outside the hub", () => {
  test("explicit choice wins, regional device locales work, unsupported languages fall back", () => {
    expect(preferredLanguage("ja", "vi-VN")).toBe("ja");
    expect(preferredLanguage("obsolete", "zh-CN")).toBe("zh");
    expect(preferredLanguage(null, "KO-kr")).toBe("ko");
    expect(preferredLanguage(null, "fr-FR")).toBe("en");
    expect(requestLanguage("fr-FR,ja-JP;q=0.6,ru;q=0.8")).toBe("ru");
    expect(requestLanguage("ja;q=0,ko;q=invalid,zh;q=0.5")).toBe("zh");
    expect(requestLanguage(null)).toBe("en");
  });
  test("catastrophic SSR errors stay translated without the normal JavaScript bundle", () => {
    for (const { code } of LANGUAGES) {
      const page = renderErrorPage(code);
      expect(page).toContain(`<html lang="${code}">`);
      expect(page).toContain(UI[code].error_page_title);
      expect(page).toContain(UI[code].retry);
      expect(page).toContain(UI[code].go_home);
    }
    const script = renderErrorPage().match(/<script>([\s\S]*?)<\/script>/)![1]!;
    for (const stored of ["ru", null, "<script>invalid</script>", "constructor", "__proto__"]) {
      const fields: Record<string, { textContent: string }> = {};
      const document = {
        documentElement: { lang: "en" },
        title: "",
        getElementById: (id: string) => (fields[id] ??= { textContent: "" }),
      };
      runInNewContext(script, {
        document,
        navigator: { language: "ja-JP" },
        localStorage: {
          getItem: () => {
            if (stored === null) throw new Error("denied");
            return stored;
          },
        },
      });
      const locale = stored === "ru" ? "ru" : "ja";
      expect(document.documentElement.lang).toBe(locale);
      expect(fields["error-title"]?.textContent).toBe(UI[locale].error_page_title);
      expect(fields["error-home"]?.textContent).toBe(UI[locale].go_home);
    }
  });
});
