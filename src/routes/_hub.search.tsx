import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_hub/search")({
  head: () => ({ meta: [{ title: "Search — InterContinental Danang" }] }),
  component: () => null,
});
