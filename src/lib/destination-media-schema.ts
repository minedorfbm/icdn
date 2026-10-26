import { z } from "./validation";
import { photoRow, postRow, videoRow } from "./hub-schema";
import { collectionItemRow } from "./destination-collection-schema";
import { destinationNoticeRow } from "./destination-notices-schema";
import { openingHoursRow } from "./opening-hours-schema";

export const destinationMediaSchema = z.object({
  collection: z.array(collectionItemRow).nullable(),
  photos: z.array(photoRow).nullable(),
  posts: z.array(postRow).nullable(),
  videos: z.array(videoRow).nullable(),
  hours: z.array(openingHoursRow).nullable(),
  notices: z.array(destinationNoticeRow).nullable(),
});
export type DestinationMediaData = z.infer<typeof destinationMediaSchema>;
