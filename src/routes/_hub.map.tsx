import { createFileRoute } from "@tanstack/react-router";
import { mapRequest } from "@/features/resort-map/map-background";

export const Route = createFileRoute("/_hub/map")({
  validateSearch: mapRequest,
  head: () => ({ meta: [{ title: "Resort map — InterContinental Danang" }] }),
  component: () => null,
});
