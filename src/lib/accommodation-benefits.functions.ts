import { createServerFn } from "@tanstack/react-start";
import { z } from "./validation";
import { publicReader } from "./public-collection.server";
import { publicCache, readPublicSnapshot } from "./hub-cache.server";
import { benefitContent, benefitRow, benefitTranslationRow } from "./accommodation-benefits";

/** Requested only when Benefits is opened; anonymous RLS checks visible card ownership. */
export const getAccommodationBenefits = createServerFn({ method: "GET" })
  .validator(
    z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/),
  )
  .handler(({ data: id }) =>
    readPublicSnapshot(
      `accommodation-benefits-v1/${id}`,
      benefitContent,
      () => true,
      async () => {
        const read = publicReader();
        const groups = await read(
          "accommodation_benefits",
          benefitRow,
          "active",
          undefined,
          id,
          "id",
        );
        if (groups === null) throw new Error("Benefits unavailable");
        if (!groups.length) return { group: null, translations: [] };
        const translations = await read(
          "accommodation_benefit_translations",
          benefitTranslationRow,
          "published",
          undefined,
          id,
          "benefits_id",
        );
        if (translations === null) throw new Error("Benefits translations unavailable");
        return { group: groups[0]!, translations };
      },
      publicCache(),
    ),
  );
