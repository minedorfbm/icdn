import { useCardEntryMotion } from "@/lib/card-entry-context";
import type { Destination } from "@/data/resort";
import { cardHubData } from "@/lib/destination-card";
import { detailHeroPreload } from "@/lib/responsive-image";
import { NotFoundPage } from "@/components/NotFoundPage";
import { loadDestinationCard, peekHubData } from "@/lib/hub-client";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { createHubValue } from "@/data/hub-value";
import { DestinationDetail } from "@/components/hub/DestinationDetail";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import { canonicalDestinationId, findPublicDestination } from "@/lib/destination-route";

export const Route = createFileRoute("/_hub/$destinationId")({
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const catalogue = parent.loaderData?.catalogue ?? peekHubData();
    const id = canonicalDestinationId(params.destinationId);
    let destination: Destination | undefined;
    if (catalogue) {
      destination = findPublicDestination(
        createHubValue(catalogue).destinations,
        params.destinationId,
      );
    } else {
      const parentCard = parent.loaderData?.card;
      const card = parentCard?.destination.id === id ? parentCard : await loadDestinationCard(id);
      if (card) destination = createHubValue(cardHubData(card)).destinations[0];
    }
    if (!destination) throw notFound();
    return destination;
  },
  head: ({ loaderData: destination }) =>
    destination
      ? {
          links: [
            {
              rel: "preload",
              as: "image",
              ...detailHeroPreload(destination.detailImage),
              fetchPriority: "high",
            },
          ],
          meta: [
            { title: `${destination.name} — InterContinental Danang` },
            { name: "description", content: destination.short_description },
            { property: "og:title", content: `${destination.name} — InterContinental Danang` },
            { property: "og:description", content: destination.short_description },
            {
              property: "og:image",
              content: new URL(destination.image, "https://icdn.artdigitaljourney.com").href,
            },
            { name: "twitter:card", content: "summary_large_image" },
          ],
        }
      : {},
  component: DestinationRoute,
  notFoundComponent: NotFoundPage,
});

function DestinationRoute() {
  const destination = Route.useLoaderData();
  const animateEntry = useCardEntryMotion();
  const { closeDestination } = useDestinationNavigation();
  return (
    <DestinationDetail
      key={destination.id}
      dest={destination}
      animateEntry={animateEntry}
      onClose={closeDestination}
      aboveMap
      portalled={false}
    />
  );
}
