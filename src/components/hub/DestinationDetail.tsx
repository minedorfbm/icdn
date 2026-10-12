import type { Destination } from "@/data/resort";
export { EditorialDestinationDetail as DestinationDetail } from "./EditorialDestinationDetail";

export type DestinationDetailProps = Readonly<{
  dest: Destination;
  onClose: () => void;
  aboveMap?: boolean;
  neutral?: boolean;
  portalled?: boolean;
}>;
