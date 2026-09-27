# Nam Tram journey

The four chapters use native vertical scrolling. The rail cabin stays at each station while its cards are explored, then travels as the next chapter enters the viewport. Its position is calculated from the actual section tops, so changes to translated text and collection height do not shift the station alignment. The same calculations work when scrolling back up or interrupting a gesture.

`use-journey-motion.ts` caches section geometry with ResizeObserver and schedules paint updates through requestAnimationFrame only after scroll/resize events. React state changes only when the active station or rail visibility changes. Near the viewport, backgrounds move by at most 40px; headings and card decks enter with small vertical offsets and opacity changes. Horizontal card gestures remain owned by CardStack. Reduced-motion preferences remove the scene entrances and use instant station jumps.

## Artwork

`src/assets/nam-tram-signature.webp` replaces the former illustration in both the rail and the station selector. The source was the user-provided `singesmajnamtram.png`. ImageGen's built-in tool prepared a transparent cutout; the output was then resized to 640px wide and encoded as WebP with alpha (about 79KB).

The edit prompt was: “Use case: background-extraction. Edit target: the attached Nam Tram illustration. Remove ONLY the white background, including all white openings inside the cabin behind and between the posts and monkeys. Produce a real transparent alpha background, not a checkerboard or solid fill. Preserve exactly the cabin silhouette, straw roof, dark woven boat hull, metal posts and rails, three monkeys with their exact see-no-evil/hear-no-evil/speak-no-evil poses, and the small monkey ornament on the left. Preserve their colors, fine texture, frontal composition and proportions. No added objects, no shadow outside the object, no text. Entire cabin must stay within frame. This is an existing website asset replacement; do not redesign.”

## Validation

Unit tests cover exact station alignment, unequal chapter heights, dwelling at a station, interrupted/reversed movement, short chapters, and bounded entrance progress. Browser checks at 390 × 844 cover the selector illustration, Heaven/Sea jumps, reversal between Earth and Sea, no horizontal page overflow, and opening a destination detail. Physical iPhone gesture smoothness still needs device confirmation.
