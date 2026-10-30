# Brume céleste hero motion

Scope: homepage hero only, portrait mobile and desktop. Existing photographs, logo, ivory cloud texture, key, responsive image candidates and preloads are reused. The background photograph is fixed on every format.

## Choreography

The entrance runs once per document. Logo: 0.4 s delay / 2.2 s rise. Title lines: 1.15 s and 1.38 s delays, 1.25 s and 1.35 s rises. Caption: 1.85 s delay / 1.2 s rise. Key: 2.1 s delay / 1.15 s rise. Two cloud layers arrive over 3.3 s; the front veil dissolves by 4.4 s. Afterward clouds drift over 18/36 s cycles and the key floats/sways over 7/10 s cycles.

The approved simulation's small displacements and staging are retained, with two production adaptations: title and logo stay visible from first paint instead of starting at opacity zero; motion never waits for image decoding. The front veil's continuous breathing starts when its entrance fade ends, avoiding a discontinuity. Functional controls keep their existing hit targets and availability.

## Performance and accessibility

Native Web Animations API timelines animate transform/opacity only. There is no per-frame JavaScript loop, scroll handler, new animation dependency or new image download. Cloud opacity is resolved to numeric keyframes at setup/breakpoint changes, avoiding per-frame CSS variable resolution. The same lightweight cloud asset is shared by both layers.

Loops pause when the hero is outside the viewport or the document is hidden, and resume at their current time. Returning to the hero does not replay the entrance. Reduced-motion users get the existing still composition; enabling motion later starts only the subtle loops. The same usable still remains if JavaScript or the animation API is unavailable. All effects are cancelled and observers/listeners removed when the component unmounts. No manual playback control is added.

## Validation

- Production build, type checking and lint pass (one pre-existing hook warning outside this change).
- 24 targeted browser checks pass across Chromium and WebKit: responsive layout, image delivery, readable entry, interpolation, offscreen pause/resume, reduced motion, missing API and server HTML without JavaScript.
- Still captures at 390×844 and 1440×900 are byte-for-byte identical at the decoded pixel level to the preceding production build with reduced motion. Representative animated frames inspected at 0.8, 2.3, 4.5 and 12 seconds.
- Homepage route chunk: 5,131 → 6,332 gzip bytes (+1,201 bytes). No new image assets or libraries.

Local measurements use identical image fixtures and a local Worker with Chrome CPU throttled 4×. They are comparative diagnostics, not a Lighthouse score, a real-device 60 FPS certification or a Vietnamese network benchmark.

| Local viewport | Median FCP before → after | Median LCP before → after | CLS | Hero photo requests |
| --- | --- | --- | --- | --- |
| 390px | 140 → 148 ms | 160 → 164 ms | 0 | 1 |
| 1440px | 140 → 140 ms | 156 → 152 ms | 0 | 1 |

Three cold contexts per condition. These small differences lie within local run variability. Four-second animation samples recorded zero layout operations on both formats. The headless environment delivered about 30 FPS for both the static baseline and animated hero; it cannot validate 60 FPS on a physical device.
