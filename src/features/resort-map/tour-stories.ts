import stories from "./tour-stories.json";
import type { TourText } from "./tour-copy";

type TourStory = { story: TourText; look: TourText };
// Editorial data, ordered by the same six languages as TourText. Completeness is tested.
export const tourStories = stories as Record<string, TourStory>;
