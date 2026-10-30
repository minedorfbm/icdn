# Suspended card swipe

Journey and Surprise me share the existing CardStack gesture controller. Only its visual transition changes; card dimensions, layout CSS, content, links, navigation controls and image admission remain unchanged.

- Horizontal movement follows the pointer, with Z tilt capped at 6 degrees and a small Y rotation. Existing perspective preview slots are retained.
- The incoming card advances from its existing preview slot. The photo shifts by at most 4 px, with minimal overscan to cover its edges.
- A 460 ms CSS ease-out completes or cancels the gesture without a spring. An interrupted transition carries its current transform into the next gesture.
- The original axis lock, distance/flick thresholds, edge resistance, pointer cancellation and post-drag click suppression are retained.
- Four projected corners constrain the moving card to the existing stage vertically. This temporarily reduces its painted scale where necessary, without changing the layout box or adding spacing.
- Progress uses transform rather than animated width. The counter changes only when selection commits.
- Reduced motion keeps the cards still during the gesture and changes selection immediately. Touch pan-y, keyboard activation and existing hover/click actions remain available.

## Performance

No dependencies or media were added. The built CardStack JavaScript increases from 6,321 to 7,747 bytes gzip; its CSS increases from 2,132 to 2,234 bytes gzip: 1,528 bytes in total. Existing image sources and source selection do not change while dragging.

The existing requestAnimationFrame coalescer limits updates to one per frame, and memoized destination panels are reused. Layout is measured when geometry changes and at gesture boundaries, not on every move. Photographic depth updates only the image's individual translate/scale properties; no animated blur or inherited animated custom properties are used. There is no continuous animation loop after release.

Local comparison against main 47a7681 used identical cached image fixtures, Chrome, a 390 px viewport and 4x CPU throttling, with two 60-frame drags for each layout. After the change, median frame intervals were 16.6–16.7 ms and p95 intervals 17.4–18.2 ms, with no layout passes during the measured gestures. Main-thread time increased by about 0.7–1.0 ms per sampled frame at 4x CPU throttling. These are local laboratory observations, not Lighthouse scores or guarantees for physical phones.

## Verification

- TypeScript and production build pass. ESLint has no errors; its pre-existing missing location.search dependency warning is outside this change.
- Ten motion/gesture unit tests pass (330 assertions).
- Targeted Chromium and WebKit browser suite: 31 pass; one WebKit-only skip for the Chromium CDP native-touch probe.
- Journey and Surprise tested at 320, 360 and 390 px: both directions, insufficient gesture, cancellation, rapid successive swipes, exact stage/card layout dimensions, no horizontal page overflow, unchanged image source, touch axis, keyboard activation and post-drag click protection.
- Reduced motion, existing menu links, mobile level fit and Nam Tram docking tests pass. Native Chromium touch scrolling cancels the horizontal gesture without changing selection.
- Additional before/after layout comparison at 320, 390, 768 and 1440 px confirms identical stage and card boxes in both layouts, without horizontal document overflow. Real photo captures were inspected at 390 and 1440 px.

Physical-device testing remains useful for Safari/browser toolbar changes, thermal throttling and low-memory devices. No changes are made to the existing inner-card vertical scrolling containment.
