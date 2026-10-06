import { getHubData } from "@/lib/hub.functions";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createHubValue } from "@/data/hub-value";
import { DestinationDetail } from "@/components/hub/DestinationDetail";
import { useDestinationNavigation } from "@/lib/use-destination-navigation";
import { findPublicDestination } from "@/lib/destination-route";

export const Route = createFileRoute("/_hub/$destinationId")({
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const catalogue = parent.loaderData?.catalogue ?? (await getHubData());
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
  notFoundComponent: () => (
    <section className="brand-ui fixed inset-0 z-[100] grid place-content-center gap-6 bg-background p-8 text-center">
      <h1 className="font-serif text-4xl">404</h1>
      <Link to="/" className="min-h-11 border-b p-3">
        InterContinental Danang — Digital Hub
      </Link>
    </section>
  ),
});

function DestinationRoute() {
  const destination = Route.useLoaderData();
  const { closeDestination, neutral } = useDestinationNavigation();
  return (
    <DestinationDetail
      key={destination.id}
      dest={destination}
      onClose={closeDestination}
      aboveMap
      neutral={neutral}
      portalled={false}
    />
  );
}
