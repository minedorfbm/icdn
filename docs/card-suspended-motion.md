# Suspended card swipe

Journey and Surprise me share the existing CardStack gesture controller. Only its visual transition changes; card dimensions, layout CSS, content, links, navigation controls and image admission remain unchanged.

- Horizontal movement follows the pointer, with Z tilt capped at 6 degrees and a small Y rotation. Existing perspective preview slots are retained.
- Tilt becomes perceptible earlier in short touch gestures, reaching the 6-degree cap at 45% of a card width. Desktop arrows and exposed-card clicks play a native 650 ms suspended timeline with a mid-transition tilt, including Surprise me.
- The incoming card advances from its existing preview slot. The photo shifts by at most 6 px, with minimal overscan to cover its edges.
- A 650 ms CSS ease-out completes or cancels the gesture without a spring. An interrupted transition carries its current transform into the next gesture.
- The original axis lock, distance/flick thresholds, edge resistance, pointer cancellation and post-drag click suppression are retained.
- Four projected corners constrain the moving card to the existing stage vertically. This temporarily reduces its painted scale where necessary, without changing the layout box or adding spacing.
- Progress uses transform rather than animated width. The counter changes only when selection commits.
- Reduced motion keeps the cards still during the gesture and changes selection immediately. Touch pan-y, keyboard activation and existing hover/click actions remain available.

## Performance

No dependencies or media were added. The built CardStack JavaScript increases from 6,321 to 8,483 bytes gzip; its CSS increases from 2,132 to 2,234 bytes gzip: 2,264 bytes in total. Existing image sources and source selection do not change while dragging.

The existing requestAnimationFrame coalescer limits touch updates to one per frame, and memoized destination panels are reused. Layout is measured when geometry changes and at gesture boundaries, not on every move. Photographic depth updates only the image's individual translate/scale properties. Click choreography precomputes five poses and uses the browser's native Animation API, without React updates on each frame. Subsequent clicks capture the currently painted state; horizontal touch takes over an ongoing native animation. There is no continuous loop after release, new media, animated blur or inherited animated custom property.

A local Chrome sample used identical cached image fixtures and 4x CPU throttling. At 390 px, touch drags had a 16.7 ms median and 17.5 ms p95 frame interval in both layouts, with no layout passes during the measured gestures. At 1440 px, native click sequences had 16.7 ms median and 16.8 ms p95 intervals in both layouts; one/two layout passes accompanied the selection/content change, rather than a layout pass on each animation frame. These are local laboratory observations, not Lighthouse scores or guarantees for physical phones.

## Verification

- TypeScript and production build pass. ESLint has no errors; its pre-existing missing location.search dependency warning is outside this change.
- Twelve motion/gesture unit tests pass (345 assertions).
- Targeted Chromium and WebKit browser suite: 35 scenarios pass; one WebKit-only skip for the Chromium CDP native-touch probe.
- Journey and Surprise tested at 320, 360 and 390 px: both directions, insufficient gesture, cancellation, rapid successive swipes, exact stage/card layout dimensions, no horizontal page overflow, unchanged image source, touch axis, keyboard activation and post-drag click protection.
- Native mouse clicks on the arrows and exposed next card are verified on desktop in Chromium/WebKit, including mid-motion tilt, 650 ms duration, rapid arrow reversals, unchanged boxes and reduced-motion selection.
- Reduced motion, existing menu links, mobile level fit and Nam Tram docking tests pass. Native Chromium touch scrolling cancels the horizontal gesture without changing selection.
- Additional before/after layout comparison at 320, 390, 768 and 1440 px confirms identical stage and card boxes in both layouts, without horizontal document overflow. Real photo captures were inspected at 390 and 1440 px.

Physical-device testing remains useful for Safari/browser toolbar changes, thermal throttling and low-memory devices. No changes are made to the existing inner-card vertical scrolling containment.
