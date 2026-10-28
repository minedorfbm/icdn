import { createFileRoute } from "@tanstack/react-router";
import { SurprisePage } from "@/features/discovery/SurprisePage";

export const Route = createFileRoute("/_hub/surprise-me")({
  head: () => ({ meta: [{ title: "Surprise me — InterContinental Danang" }] }),
  component: SurprisePage,
});
