import { createRouter } from "@tanstack/react-router";
import { NotFoundPage } from "./components/NotFoundPage";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
