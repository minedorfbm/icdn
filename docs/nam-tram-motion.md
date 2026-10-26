# Nam Tram journey

The four chapters use native vertical scrolling. The rail cabin stays at each station while its cards are explored, then travels as the next chapter enters the viewport. Its position is calculated from the actual section tops, so changes to translated text and collection height do not shift the station alignment. The same calculations work when scrolling back up or interrupting a gesture.

`use-journey-motion.ts` caches section geometry with ResizeObserver and schedules paint updates through requestAnimationFrame only after scroll/resize events. React state changes only when the active station or rail visibility changes. Near the viewport, backgrounds move by at most 40px; headings and card decks enter with small vertical offsets and opacity changes. Horizontal card gestures remain owned by CardStack. Reduced-motion preferences remove the scene entrances and use instant station jumps.

## Artwork

Two owner-supplied illustrations have separate roles:

- `src/assets/nam-tram-rail.webp`: angled view from `nam tram illustration 2.png`, 240 × 219 px, about 21 KB. It follows the scroll position on the navigation rail.
- `src/assets/nam-tram-selector.webp`: horizontal front view from `nam tram illustration.png`, 900 × 600 px, about 155 KB. It appears when the visitor opens the station selector.

Both WebP files preserve the original alpha transparency and composition. The rail loads only its compact illustration; the larger selector artwork is mounted when the panel opens. Image dimensions reserve the correct aspect ratio. The previous three-monkey asset is no longer referenced.

## Validation

Unit tests cover exact station alignment, unequal chapter heights, dwelling at a station, interrupted/reversed movement, short chapters, and bounded entrance progress. Browser checks at 390 × 844 cover the selector illustration, Heaven/Sea jumps, reversal between Earth and Sea, no horizontal page overflow, and opening a destination detail. Physical iPhone gesture smoothness still needs device confirmation.
