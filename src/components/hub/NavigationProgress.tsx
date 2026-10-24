import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/i18n";

/** Acknowledge slow navigation without replacing the current page or shifting it. */
export function NavigationProgress() {
  const loading = useRouterState({ select: (state) => state.isLoading });
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();
  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, [loading]);
  if (!loading || !visible) return null;
  return (
    <output className="brand-ui brand-floating pointer-events-none fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-[150] -translate-x-1/2 rounded-full px-5 py-3 text-sm shadow-md">
      {t("page_loading")}
    </output>
  );
}
