import { Link } from "@tanstack/react-router";
import { useErrorCopy } from "../i18n/use-error-copy";

export function NotFoundPage() {
  const copy = useErrorCopy();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{copy.not_found_title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.not_found_body}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copy.go_home}
          </Link>
        </div>
      </div>
    </div>
  );
}
