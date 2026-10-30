import beeEater from "@/assets/journey-effects/bee-eater-670eb76adc.webp?no-inline";
import drongo from "@/assets/journey-effects/drongo-d431d18359.webp?no-inline";
import sunbird from "@/assets/journey-effects/sunbird-2ed1802df9.webp?no-inline";
import branchLeft from "@/assets/journey-effects/branch-left-027889e0c1.webp?no-inline";
import branchRight from "@/assets/journey-effects/branch-right-32be50e70a.webp?no-inline";
import liana from "@/assets/journey-effects/liana-441a6c486e.webp?no-inline";
import fern from "@/assets/journey-effects/fern-3c37df926b.webp?no-inline";
import leafGreen from "@/assets/journey-effects/leaf-green-192cab1cbd.webp?no-inline";
import leafGold from "@/assets/journey-effects/leaf-gold-2afa1bf432.webp?no-inline";
import leafSmall from "@/assets/journey-effects/leaf-small-71d189f850.webp?no-inline";
import waves from "@/assets/journey-effects/corner-waves-ecdd27bba8.webp?no-inline";
import "./journey-atmosphere.css";

const birds = [
  { source: beeEater, width: 256, height: 266 },
  { source: drongo, width: 280, height: 237 },
  { source: sunbird, width: 140, height: 149 },
];
const plants = [
  { source: branchLeft, width: 270, height: 187 },
  { source: branchRight, width: 190, height: 184 },
  { source: liana, width: 96, height: 402 },
  { source: fern, width: 220, height: 152 },
  { source: leafGreen, width: 72, height: 35 },
  { source: leafGold, width: 72, height: 27 },
  { source: leafSmall, width: 72, height: 28 },
];

/** A paint-only viewport, bounded by the real journey. No extra space or public controls. */
export function JourneyAtmosphere({
  onBackdropRoot,
}: Readonly<{
  onBackdropRoot: (element: HTMLDivElement | null) => void;
}>) {
  return (
    <div className="journey-atmosphere" aria-hidden="true">
      <div className="journey-atmosphere-photos" ref={onBackdropRoot} />
      <div className="journey-atmosphere-decor">
        <div data-atmosphere-effect="heaven" className="atmosphere-effect">
          <div className="atmosphere-halo" />
          <div className="atmosphere-rays" />
          {[0, 1].map((part) => (
            <img
              key={part}
              className="atmosphere-cloud"
              data-part={part}
              data-src="/hero-cloud-ivory-a26e472d.webp"
              width={960}
              height={321}
              alt=""
              decoding="async"
              fetchPriority="low"
              draggable={false}
            />
          ))}
        </div>
        <div data-atmosphere-effect="sky" className="atmosphere-effect">
          {birds.map(({ source, width, height }, part) => (
            <img
              key={source}
              className="atmosphere-bird"
              data-part={part}
              data-src={source}
              width={width}
              height={height}
              alt=""
              decoding="async"
              fetchPriority="low"
              draggable={false}
            />
          ))}
        </div>
        <div data-atmosphere-effect="earth" className="atmosphere-effect">
          {plants.map(({ source, width, height }, part) => (
            <img
              key={source}
              className="atmosphere-plant"
              data-part={part}
              data-src={source}
              width={width}
              height={height}
              alt=""
              decoding="async"
              fetchPriority="low"
              draggable={false}
            />
          ))}
        </div>
        <div data-atmosphere-effect="sea" className="atmosphere-effect">
          {[0, 1].map((part) => (
            <img
              key={part}
              className="atmosphere-wave"
              data-part={part}
              data-src={waves}
              width={960}
              height={320}
              alt=""
              decoding="async"
              fetchPriority="low"
              draggable={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
