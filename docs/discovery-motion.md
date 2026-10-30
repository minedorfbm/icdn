# Discovery motion — production integration

Homepage scope: only “Choose your discovery”. The three existing buttons, their actions, fonts, image sources, loading hints and layout are reused. Mobile, tablet and desktop keep the existing stacked, fluid composition (maximum inner width 740px); no scaled screenshot or new columns are introduced. Hero motion and all other sections remain unchanged.

## Reference and choreography

Source: the validated `discovery-motion.html` simulation dated 2026-10-30. The heading fades/rises 8px over 1s. Each visible card fades/rises 14px over 0.95s. Simultaneously visible entries are scheduled in DOM reading order: heading first, 450ms before the first card, then 180ms between cards. A card that has not entered the viewport is never started by the section's timer. One shared IntersectionObserver starts each element at 20% visibility. No scroll handler is installed.

Each graphic performs one short story during its entrance: the tram fades in from above, moves 5px left/11px down and returns; the map fades from 30% with a -19° to -12° rotation; the photos open from a closed stack into a slightly wider fan and return to the existing positions. The graphics' original transform origins/rest geometry are retained to avoid a jump at completion.

As requested in the final performance direction, the simulation's repeating 13-second stories are **not** carried into the public page. After the initial story, all automatic Discovery motion ends and the existing hover, keyboard-focus and touch-press effects take over. Clicks navigate rather than replay. No Pause/Replay controls are added.

## Delivery, fallback and accessibility

Motion uses finite CSS keyframes on transform/opacity, with a small lifecycle helper. No dependency, encoded image, GIF, video, image-decode gate, per-frame script or new image request is introduced. Decorative graphics remain inside the existing clipped card surfaces. Live text, button semantics, focus indicators and handlers are preserved.

Running entrances pause offscreen or in hidden documents. Completed elements are unobserved and never replay in that document, including after remount. Reduced motion immediately restores the final composition and consumes the entrance. Keyboard focus ends the focused card's entrance immediately. Without CSS animation support the default visible content and navigation remain usable. Observers/listeners are removed on unmount.

## Verification

- Production build, lint and type checking pass; the unrelated existing hook-dependency warning is unchanged.
- 28 Chromium/WebKit browser checks pass: 320, 390, 768, 1024 and 1440px; card/text bounds; no horizontal scrolling; once-only entrances; pause/resume; hidden-document pause; reduced motion; keyboard focus/Enter; touch map navigation; journey click during entry; disabled CSS animations; and unchanged AVIF/WebP thumbnail delivery.
- Real-asset still captures at all five widths are pixel-identical to the baseline with reduced motion (PSNR infinite). Representative animated frames inspected at 0.3, 1.2, 2.2 and 3.3 seconds. Desktop hover transforms confirmed to change for all three graphics after entrance.
- The deferred journey JavaScript chunk grows from 6,388 to 7,010 gzip bytes (+622). Shared Discovery CSS grows from 1,713 to 2,132 gzip bytes (+419). Total addition: **1,041 gzip bytes**, with unchanged image URLs/candidates. Main hero and global stylesheet payloads remain unchanged.
- Local comparative tests use identical cached real image fixtures and a local Worker with Chrome CPU throttled 4×. Both versions sampled approximately 16.7ms frame intervals during the entrance. After settling, the new section has zero running animations, zero layout operations and zero style recalculations in the measured 1.5s idle window. The same five Discovery image candidates are requested before/after.
- Initial page CLS is 0 in both builds. When programmatically scrolling to Discovery, the complete page's measured CLS ranges from 0 to 0.02749 in both builds (also present in the baseline; its source was not isolated). No higher shift was observed in these samples. Startup timings on the shared host vary and do not establish a Lighthouse score or a network latency claim. These lab samples do not certify 60 FPS on every physical device.

A live preview and physical-device review remain useful before merging. No production merge is part of this implementation step.
