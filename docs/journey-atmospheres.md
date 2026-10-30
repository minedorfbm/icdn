# Journey atmosphere transitions

The validated `corner-waves.html` and `mobile-sea-descent.html` supply the visual choreography and transparent artwork. Their playback controls, synthetic scrolling, canvases and photographic backgrounds are not shipped. Existing resort photos, palette tokens, text, typography, card sizes and interactions are retained.

## Integration

The three gradient spacer elements and their CSS are removed. A native sticky paint viewport occupies zero net flow height (its height is cancelled by its negative margin). Existing level photos are portaled into this viewport and crossfade together with their original colors. Their current loading/readiness and 10% photo opacity are preserved. Section and card dimensions stay unchanged; only the former spacer height is removed. A rectangular clip bounds the zero-flow sticky surface at the last station, preventing its paint from spilling over the footer without creating another scroll container.

`useJourneyMotion` supplies the existing passive, coalesced scroll clock. Section positions are measured on layout changes, including real fractional offsets and the existing arrival scroll margin. Progress is recalculated from scrolling, including reversals and fast skips; no wheel/touch interception, scroll lock or animation queue is introduced. The Nam Tram and existing docking assistance remain intact.

HEAVEN plays a warm 1.9-second cloud/light entrance. SKY uses exactly three separately cropped birds (bee-eater, drongo, sunbird). EARTH uses two branches, one liana, a fern and three individual leaves. SEA uses two offset instances of the validated illustrated wave, rising from the lower right behind the content, without a boat. Mobile trajectories keep the branches and small sunbird away from the title/category area. Arrival tails last at most 950/750/1400 ms; effects then hide completely.

No continuous idle loop runs. Hidden tabs and offscreen journeys clear pending tails. Reduced motion uses the original static section palette/photos and does not request decorative assets. Semantic controls, focus indicators and card interactions are unchanged; decoration is aria-hidden and cannot intercept pointers. A ready guard keeps native readable section backgrounds if the enhancement has not initialized.

## Delivery size and image handling

Eleven separate transparent WebP files add **108,438 bytes**: birds 25,604; plants/leaves 59,536; waves 23,298. Reference crop rectangles and polygon separation are applied offline, with no runtime canvas. The cloud is byte-identical to the existing `/hero-cloud-ivory-a26e472d.webp` (SHA-256 `a26e472dfd8cb5fcb4f34a19dd2ea8bdb6a4373b17dfea2e69fdedc3f4c82c46`) and reuses that file/cache entry.

Imports explicitly use Vite `?no-inline`, including the small leaves: no embedded image payload is added to JavaScript. Source assignment is deferred until approach, at low priority; intentional Nam Tram jumps only admit their requested effects. Intrinsic dimensions are supplied. No dependency, video, GIF or new photographic background is added.

The production build adds approximately **3.5 KB gzip of JS/CSS** compared with main `87258a3`. Initial hero checks observe **zero new decorative image requests**. The readiness observer ignores edge-only intersections, preventing a just-departed chapter from warming at the shared seam in Safari.

## Verification and limits

- Production build, TypeScript and ESLint pass (one existing unrelated dependency warning in `use-destination-navigation.ts`). Twenty targeted unit tests pass, with 491 assertions.
- Chromium/WebKit: 57 targeted browser scenarios pass; one Chromium-CDP native-touch probe is skipped on WebKit. Checks include 320/390/768/1024/1440 px, resize, slow/fast/reversed progression, arrival cleanup, hidden document, no idle style writes, reduced motion, existing swipe/click/keyboard controls, docking, level index and image order. Six focused scenarios were rechecked after supplying image dimensions; all 16 atmosphere scenarios were rechecked after bounding footer paint.
- Identical warmed-image local comparison, Chrome with 4x CPU throttling: median frame interval **16.7 ms** before/after. Mobile p95 **18.6 → 17.5 ms**; desktop **18.4 → 17.7 ms**. Main-thread time in the sampled scroll sequence: mobile **2059 → 1566 ms**, desktop **1927 → 1668 ms**. Six/seven layout passes occurred over 240 sampled frames after the change; no layout/style work was recorded in the settled idle interval. One mobile frame reached 43.6 ms in the final run, so this is not a zero-dropped-frame guarantee. The footer-only screenshot matches the static fallback pixel-for-pixel at both widths. These are laboratory samples, not guarantees of physical-device FPS or Lighthouse scores.
- The full CI run exposed a palette assertion still reading the now-transparent section background; it now verifies the actual shared paint plane. Safari intermittent navigation/prefetch cases were rechecked: 19 production scenarios pass (one CDP skip), and all five affected instrumented scenarios pass locally. The updated remote CI run remains authoritative before merge.
- Card/section dimensions match before/after, with no horizontal overflow. The sampled CLS is unchanged (mobile 0.0321 in the existing fixture; desktop 0). Removing the requested gradient spacers intentionally reduces the journey's total height.
- A physical iPhone still needs validation for Safari toolbar expansion/collapse, native finger inertia, low-power mode/older GPU, cold loading on the resort network and repeated navigation after memory pressure.

## Changed files

- `src/components/hub/HubJourney.tsx`, `LevelChapter.tsx`: shared paint surface and photo portals.
- `src/components/hub/JourneyAtmosphere.tsx`, `journey-atmosphere.css`: decoration and responsive, paint-only geometry.
- `src/components/hub/level-chapter.css`, `src/styles.css`: remove spacers and obsolete photo motion hints.
- `src/lib/atmosphere-motion.ts`, `journey-atmosphere.ts`: reversible poses, whole-world blend and finite arrival tails.
- `src/lib/use-journey-motion.ts`, `use-reduced-motion.ts`, `use-level-image-readiness.ts`: shared scheduling, preference fallback and edge-safe admission.
- `src/assets/journey-effects/*.webp`: eleven isolated optimized illustrations.
- `tests/atmosphere-motion.test.ts`, `e2e/journey-atmosphere.spec.ts`, `e2e/chapter-layout.spec.ts`, `e2e/journey-image-order.spec.ts`, `e2e/level-palettes.spec.ts`: phase, lifecycle, layout and image-priority coverage.
