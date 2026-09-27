import tramIllustration from "@/assets/nam-tram-signature.webp";

/** The same transparent cabin artwork is shared by the rail and station selector. */
export function NamTramCabin() {
  return (
    <img
      src={tramIllustration}
      alt=""
      aria-hidden="true"
      width={640}
      height={482}
      fetchPriority="low"
      decoding="async"
      className="nam-tram-cabin"
    />
  );
}
