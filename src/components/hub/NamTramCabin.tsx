import tramIllustration from "@/assets/nam-tram-rail.webp";

/** Angled transparent artwork follows the journey along the navigation rail. */
export function NamTramCabin() {
  return (
    <img
      src={tramIllustration}
      alt=""
      aria-hidden="true"
      width={240}
      height={219}
      fetchPriority="low"
      decoding="async"
      className="nam-tram-cabin"
    />
  );
}
