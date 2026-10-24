import { NotFoundPage } from "@/components/NotFoundPage";
import { loadHubData } from "@/lib/hub-client";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createHubValue } from "@/data/hub-value";
import { DestinationDetail } from "@/components/hub/DestinationDetail";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import { findPublicDestination } from "@/lib/destination-route";

export const Route = createFileRoute("/_hub/$destinationId")({
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const catalogue = parent.loaderData?.catalogue ?? (await loadHubData());
    const destination = findPublicDestination(
      createHubValue({
        ...catalogue,
        settings: parent.loaderData?.settings ?? null,
      }).destinations,
      params.destinationId,
    );
    if (!destination) throw notFound();
    return destination;
  },
  head: ({ loaderData: destination }) =>
    destination
      ? {
          meta: [
            { title: `${destination.name} — InterContinental Danang` },
            { name: "description", content: destination.short_description },
            { property: "og:title", content: `${destination.name} — InterContinental Danang` },
            { property: "og:description", content: destination.short_description },
            { property: "og:image", content: destination.image },
            { name: "twitter:card", content: "summary_large_image" },
          ],
        }
      : {},
  component: DestinationRoute,
  notFoundComponent: NotFoundPage,
});

function DestinationRoute() {
  const destination = Route.useLoaderData();
  const { closeDestination } = useDestinationNavigation();
  return (
    <DestinationDetail
      key={destination.id}
      dest={destination}
      onClose={closeDestination}
      aboveMap
      portalled={false}
    />
  );
}
