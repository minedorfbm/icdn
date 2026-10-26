import type { Level } from "@/data/resort";
import { ResortLevelIcon } from "./ResortLevelIcon";

/** Use the same resort symbols as the expanded cards throughout the Nam Tram navigation. */
export function NamTramStation({
  level,
  active = false,
}: Readonly<{ level: Level; active?: boolean }>) {
  return (
    <span aria-hidden="true" className="nam-tram-stop" data-active={active}>
      <ResortLevelIcon level={level} />
    </span>
  );
}
