import { imageSource } from "@/lib/image-source";

/** Angled transparent artwork follows the journey along the navigation rail. */
export function NamTramCabin() {
  return (
    <img
      src={imageSource("src/assets/nam-tram-rail.webp")}
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
