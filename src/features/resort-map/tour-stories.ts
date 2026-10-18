import stories from "./tour-stories.json";
import type { TourText } from "./tour-copy";

type TourStory = { story: TourText; look: TourText };
// JSON arrays need an explicit six-language boundary before use in the UI.
function completeText(values: string[]): TourText {
  if (values.length !== 6) throw new Error("Tour stories require all six hub languages.");
  return [values[0]!, values[1]!, values[2]!, values[3]!, values[4]!, values[5]!];
}

export const tourStories: Record<string, TourStory> = Object.fromEntries(
  Object.entries(stories).map(([id, value]) => [
    id,
    { story: completeText(value.story), look: completeText(value.look) },
  ]),
);
