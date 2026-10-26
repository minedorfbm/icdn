import { benefitContent } from "../src/lib/accommodation-benefits-schema";
import { expect, test } from "bun:test";
import { localizedBenefits } from "../src/lib/accommodation-benefits";
import { groupLinks } from "../src/data/resort";
import seed from "../docs/accommodation-benefits.json";

test("benefits translations belong to the exact current source and group", () => {
  const content = benefitContent.parse({
    group: { id: "villa", items: ["Three nights required"] },
    translations: [
      {
        benefits_id: "villa",
        locale: "ja",
        items: ["古い条件"],
        source_items: ["Two nights required"],
      },
      {
        benefits_id: "other",
        locale: "vi",
        items: ["Không đúng"],
        source_items: ["Three nights required"],
      },
      {
        benefits_id: "villa",
        locale: "ko",
        items: ["3박 이상"],
        source_items: ["Three nights required"],
      },
    ],
  });
  expect(localizedBenefits(content, "ja")).toEqual(content.group!.items);
  expect(localizedBenefits(content, "vi")).toEqual(content.group!.items);
  expect(localizedBenefits(content, "ko")).toEqual(["3박 이상"]);
  expect(localizedBenefits({ group: null, translations: content.translations }, "ko")).toEqual([]);
});

test("catalogue preserves the explicit benefits relationship alongside the source link", () => {
  const grouped = groupLinks([
    {
      id: "link",
      destination_id: "rooms",
      kind: "INFO",
      label: "Benefits",
      url: "https://example.com/room/",
      benefits_id: "standard",
      display_order: 21,
    },
  ]);
  expect(grouped["rooms"]?.[0]?.benefitsId).toBe("standard");
});

test("every accommodation has a verified PDF and fully translated shared benefits", () => {
  expect(seed.accommodations).toHaveLength(15);
  expect(new Set(seed.accommodations.map((a) => a.destination_id)).size).toBe(15);
  for (const accommodation of seed.accommodations) {
    expect(accommodation.floor_plan).toMatch(
      /^https:\/\/www\.danang\.intercontinental\.com\/wp-content\/uploads\/.*\.pdf$/,
    );
    const group = seed.groups.find((g) => g.id === accommodation.benefits_id)!;
    expect(group).toBeDefined();
    expect(group.source_urls).toContain(accommodation.source_url);
    for (const locale of ["vi", "ru", "zh", "ko", "ja"] as const) {
      expect(group.translations[locale]).toHaveLength(group.items.length);
      expect(group.translations[locale].every((item) => item.trim().length > 0)).toBe(true);
    }
  }
  const spa = seed.groups.find((g) => g.id === "spa-lagoon")!;
  expect(spa.items.join(" ")).toContain("minimum three-night stay");
  expect(seed.groups.find((g) => g.id === "villa")!.items.join(" ")).not.toContain(
    "Floating breakfast",
  );
});
