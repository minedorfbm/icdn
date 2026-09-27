import { bensleyTour } from "./map.data";
import { memo, useMemo, type ReactNode } from "react";
import {
  accommodationSites,
  buildingPlacements,
  lagoon,
  spaPods,
  spaVillas,
  trace,
} from "./map.geometry";
import type { PlaceCategory, Place } from "./map.types";

type ArchitectureArtworkProps = {
  places: Place[];
  cameraScale: number;
  selectedId: string | null;
  activeFilters: Set<PlaceCategory>;
  mode: "explore" | "tour";
};

type BuildingEntry = {
  id: string;
  Artwork: () => ReactNode;
  scale?: number;
  tier?: "hero" | "secondary";
};

function InkPlant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g className="architecture-plant" transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 13Q-2 3 1-10M1-3Q-8-15-15-8M1-5Q10-17 17-8M0 1Q-12-5-17 3M1 0Q13-6 18 3" />
      <circle cx="-15" cy="-8" r="3.4" />
      <circle cx="17" cy="-8" r="3.8" />
      <circle cx="-17" cy="3" r="3" />
      <circle cx="18" cy="3" r="3.2" />
    </g>
  );
}

function Lantern({
  x,
  y,
  color = "amber",
  scale = 1,
}: {
  x: number;
  y: number;
  color?: "amber" | "lime" | "coral";
  scale?: number;
}) {
  return (
    <g
      className={`architecture-lantern lantern-${color}`}
      transform={`translate(${x} ${y}) scale(${scale})`}
    >
      <path d="M0-8v4M0 6v4" />
      <path d="M-4-3Q0-7 4-3v7Q0 8-4 4Z" />
    </g>
  );
}

function Villa({ variant, mirror }: { variant: number; mirror: boolean }) {
  const flip = mirror ? -1 : 1;
  return (
    <g className={`atlas-villa villa-variant-${variant}`} transform={`scale(${flip} 1)`}>
      <path className="architecture-shadow" d="M-30 9 3 26 35 11 11 38-27 28Z" />
      <path className="villa-terrace" d="M-30 4 0-13 31 4 1 22Z" />
      <path className="facade-left" d="M-23-2 0 11v24l-23-13Z" />
      <path className="facade-right" d="M0 11 24-2v24L0 35Z" />
      <path className="villa-roof-edge" d="m-29-4 29-18L29-4 0 15Z" />
      <path className="villa-roof-plane villa-roof-charcoal" d="m-28-6 28-17L28-6 0 11Z" />
      {variant === 1 && (
        <>
          <path className="facade-left villa-annex" d="M15 7 32-2v17L15 25Z" />
          <path className="villa-roof-edge" d="m10 5 17-11L39 2 21 13Z" />
          <path className="villa-roof-plane villa-roof-charcoal" d="m11 4 16-10L38 1 21 11Z" />
        </>
      )}
      {variant === 2 && <path className="villa-balcony" d="M-20 14 0 25 20 14M-17 18v7M17 18v7" />}
      {variant === 3 && (
        <>
          <path className="villa-pavilion" d="M-39 7-27 0l12 7-12 8Z" />
          <path className="villa-pavilion-roof" d="m-42 5 15-10 15 10-15 9Z" />
        </>
      )}
      <g className="architecture-detail">
        <path className="villa-glazing" d="M-17 8-5 15v12l-12-7Zm22 7 13-7v12L5 27Z" />
        <Lantern x={0} y={18} scale={0.55} />
      </g>
      <path className="villa-pool" d={mirror ? "M19 25h28v10H15Z" : "M-47 25h28l4 10h-28Z"} />
      <path className="villa-pool-shine" d={mirror ? "M23 29h18" : "M-41 29h18"} />
    </g>
  );
}

function VillaVillage() {
  return (
    <g className="villa-village" aria-hidden="true">
      {accommodationSites.map(({ x, y, rotation, scale, variant, mirror }) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
          <Villa variant={variant} mirror={mirror} />
        </g>
      ))}
    </g>
  );
}

function Lobby() {
  return (
    <g className="building building-lobby">
      <InkPlant x={-73} y={10} scale={1.08} />
      <InkPlant x={73} y={8} scale={1.02} />
      <path className="architecture-shadow" d="M-79 18-8 55 83 18 42 78-22 85-91 50Z" />
      <path className="architecture-plinth" d="M-78 15 0-25 78 15 0 58Z" />
      <path className="architecture-stair" d="M-30 51 0 66 30 51 23 68 0 79-23 68Z" />
      <path className="facade-left" d="M-62-4 0 29v31L-62 27Z" />
      <path className="facade-right" d="M0 29 62-4v31L0 60Z" />
      <path className="roof-under" d="M-75-5 0-48 75-5 0 39Z" />
      <path
        className="roof-main roof-charcoal-v3"
        d="M-78-10Q-62-12-49-26L0-59l49 33q13 14 29 16L0 31Z"
      />
      <path
        className="roof-tier roof-charcoal-v3"
        d="M-42-37Q-28-39-18-49L0-65l18 16q10 10 24 12L0-19Z"
      />
      <path className="roof-ridge-v3" d="M-65-9 0 27 65-9M0-56v77M-48-26-55-19M48-26l7 7" />
      <g className="architecture-detail">
        {[-43, -21, 0, 21, 43].map((x) => (
          <path className="column-lacquer" d={`M${x} 15v30`} key={x} />
        ))}
        <path className="lattice-line" d="M-52 23-38 31M-31 34-18 41M18 41l13-7M38 31l14-8" />
        <path className="reflecting-pool" d="M-18 50 0 59 18 50 0 42Z" />
        <circle className="oculus" cy="-14" r="7" />
        <Lantern x={-28} y={31} color="coral" scale={0.72} />
        <Lantern x={28} y={31} color="coral" scale={0.72} />
      </g>
      <g className="architecture-micro tam-quan" transform="translate(-7 62)">
        <path className="tam-quan-wall" d="M-28 0h56v18h-56Z" />
        <path className="tam-quan-roof" d="M-34 0Q-23-3-18-10L0-18l18 8q5 7 16 10L0 9Z" />
        <path d="M-19 7v11M-7 5v13M7 5v13M19 7v11" />
      </g>
      <circle className="roof-finial-v3" cy="-66" r="3.5" />
    </g>
  );
}

function Citron() {
  return (
    <g className="building building-citron">
      <path className="architecture-shadow" d="M-86 13-22 42 83 4 64 51-30 62-91 32Z" />
      <path className="citron-pool" d="M-87 1-13-39 87 1 12 47Z" />
      <path className="citron-deck-v3" d="M-77 0-11-34 70-1 9 36Z" />
      <g transform="translate(28 -27)">
        <path className="facade-dark" d="M-37 0 4 18v29l-41-18Z" />
        <path className="facade-right" d="M4 18 44-3v29L4 47Z" />
        <path className="roof-under" d="m-47-2 48-27 52 23L5 23Z" />
        <path className="citron-roof" d="m-49-6 49-29L55-8 5 18Z" />
        <g className="architecture-detail">
          <path className="citron-glass" d="M-29 9 0 22v15L-29 24Zm38 11 25-13v15L9 35Z" />
          <path className="cave-mark" d="M-20 18q6-9 11 0m7 7 5-11 5 11m11 0q7-10 12 0" />
        </g>
      </g>
      {[-42, -4, 34].map((x, index) => (
        <g className="nonla-table" key={x} transform={`translate(${x} ${index === 1 ? 5 : 10})`}>
          <ellipse className="nonla-shadow-v3" cy="21" rx="25" ry="8" />
          <path className="nonla-bowl" d="M-25 0Q0 12 25 0L0 29Z" />
          <path className="nonla-rim-v3" d="M-25 0Q0-9 25 0Q0 11-25 0Z" />
          <path className="nonla-ribs architecture-detail" d="M-17 3 0 27M0 5v22M17 3 0 27" />
          <path className="nonla-post" d="M0 28v7" />
        </g>
      ))}
      <g className="architecture-micro">
        <Lantern x={57} y={-5} color="lime" scale={0.7} />
        <path className="citron-rail" d="M-72 7-9-27M8 37l58-31" />
        <circle className="monkey-fountain" cx="72" cy="20" r="5" />
      </g>
    </g>
  );
}

function HeritageVillage() {
  return (
    <g className="building building-gallery">
      <path className="architecture-shadow" d="M-80 15-8 48 84 14 52 61-27 70-90 42Z" />
      <path className="village-court" d="M-73 9-5-27 74 7 7 48Z" />
      <path className="gallery-facade-left" d="M-62-5 0 23v34L-62 30Z" />
      <path className="gallery-facade-right" d="M0 23 63-5v35L0 57Z" />
      <path className="gallery-clerestory" d="M-53-15 0 8l54-23v14L0 24-53 0Z" />
      <path className="roof-under" d="M-76-16 0-58 78-16 0 31Z" />
      <path
        className="gallery-roof roof-charcoal-v3"
        d="M-82-21Q-65-22-53-35L0-68l53 33q12 13 30 14L0 23Z"
      />
      <path
        className="gallery-roof-tier roof-charcoal-v3"
        d="M-43-48Q-29-48-21-56L0-72l21 16q8 8 22 8L0-25Z"
      />
      <path className="roof-ridge-v3" d="M-68-20 0 18 68-20M0-63v74" />
      <g className="architecture-detail">
        {[-45, -27, -9, 9, 27, 45].map((x) => (
          <path className="gallery-column" d={`M${x} 17v29`} key={x} />
        ))}
        <path className="gallery-lattice" d="M-55 25-38 33m9 4 13 6m32 0 13-6m9-4 17-8" />
        <rect className="gallery-art-window art-coral" x="-34" y="25" width="12" height="16" />
        <rect className="gallery-art-window art-lime" x="22" y="25" width="12" height="16" />
      </g>
      <path
        className="architecture-micro courtyard-pattern"
        d="M-28 48-8 38l19 9-19 11ZM5 54l19-10 17 8-19 11Z"
      />
      <Lantern x={-54} y={35} color="coral" scale={0.66} />
      <Lantern x={54} y={35} color="lime" scale={0.66} />
    </g>
  );
}

function LaMaison() {
  return (
    <g className="building building-maison">
      <InkPlant x={-84} y={24} scale={0.8} />
      <InkPlant x={84} y={24} scale={0.8} />
      <path className="architecture-shadow" d="M-91 19-8 58 94 18 58 75-21 85-101 49Z" />
      <path className="maison-terrace" d="M-91 8-3-36 91 6 2 57Z" />
      <path className="maison-wing-left" d="M-81-5-26 20v42l-55-27Z" />
      <path className="maison-wing-right" d="M26 20 81-5v40L26 62Z" />
      <path className="facade-front maison-centre" d="M-31-29h62v79h-62Z" />
      <path className="roof-under" d="M-91-8-55-35-17-16-53 8ZM17-16l38-19 37 27-39 16Z" />
      <path
        className="maison-roof roof-charcoal-v3"
        d="M-96-13-73-36-51-47-25-35-12-17-53 3Zm108-4 13-18 26-12 22 11 24 23L53 3Z"
      />
      <path className="maison-centre-roof roof-charcoal-v3" d="M-40-31-23-52H23l17 21L0-11Z" />
      <path className="roof-ridge-v3" d="M-70-34-51-43M70-34 51-43M-21-48h42" />
      <g className="architecture-detail">
        {[-66, -48, 48, 66].map((x) => (
          <path className="maison-arched-window" d={`M${x - 6} 13v-11q6-10 12 0v11Z`} key={x} />
        ))}
        {[-18, 0, 18].map((x) => (
          <path className="maison-arched-window" d={`M${x - 6} -1v-12q6-10 12 0v12Z`} key={x} />
        ))}
        <path className="maison-door" d="M-9 24Q0 12 9 24v27H-9Z" />
        <path
          className="maison-veranda"
          d="M-80 34h56M24 34h56M-73 24v20M-57 16v27M-40 25v19M40 25v19M57 16v27M73 24v20"
        />
        <path className="maison-balustrade" d="M-76 39h52M24 39h52" />
      </g>
      <g className="architecture-micro">
        <path className="maison-stairs" d="M-18 54 0 63 18 54M-23 61 0 73 23 61" />
        <circle className="buffalo-statue" cx="-43" cy="58" r="4" />
        <circle className="buffalo-statue" cx="43" cy="58" r="4" />
        <Lantern x={-14} y={35} color="amber" scale={0.6} />
        <Lantern x={14} y={35} color="amber" scale={0.6} />
      </g>
    </g>
  );
}

function CoastalPavilion({ x, y, mirror = false }: { x: number; y: number; mirror?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`}>
      <path className="facade-dark" d="M-30 1 0 16v25L-30 26Z" />
      <path className="facade-right" d="M0 16 31 1v25L0 41Z" />
      <path className="roof-under" d="M-38 0 0-25 39 0 0 22Z" />
      <path className="coastal-roof" d="M-41-5Q-30-7-22-16L0-32l22 16q8 9 20 11L0 16Z" />
      <g className="architecture-detail">
        {[-20, -8, 8, 20].map((column) => (
          <path className="coastal-column" d={`M${column} 12v22`} key={column} />
        ))}
        <path
          className="fishing-net"
          d="M-23 19q23 17 46 0M-18 20l5 13m8-9 1 13m10-13-1 13m13-17-5 13"
        />
      </g>
    </g>
  );
}

function TerraMare() {
  return (
    <g className="building building-terra">
      <path className="architecture-shadow" d="M-86 18-15 51 91 12 61 60-31 70-97 41Z" />
      <path className="terra-boardwalk" d="M-87 8-10-33 88 5 10 53Z" />
      <CoastalPavilion x={-39} y={-5} />
      <CoastalPavilion x={32} y={-12} mirror />
      <path
        className="architecture-detail terra-pergola"
        d="M-18 27 14 10M-10 31 22 14M-17 22l8 4m0-9 8 4m0-9 8 4m0-9 8 4"
      />
      <path className="architecture-micro terra-steps" d="M-25 48 4 62 30 49M-19 54 4 66 24 56" />
      <path className="architecture-micro basket-boat" d="M-76 35q12 15 25 0-12 7-25 0Z" />
    </g>
  );
}

function LongBar() {
  const bays = [-84, -66, -48, -30, -12, 6, 24, 42, 60, 78];
  return (
    <g className="building building-long">
      <path className="architecture-shadow" d="M-113 17 89 17 118 37-91 52Z" />
      <path className="long-pool-v3" d="M-114 27 106 27 91 52-127 52Z" />
      <path className="long-pool-shine" d="M-105 34 91 34M-94 41 79 41" />
      <path className="long-floor" d="M-106-6 104-6 92 27-116 27Z" />
      <path className="long-roof-under" d="M-112-15 112-15 103-4-118-4Z" />
      <path className="long-roof-v3" d="M-118-21 116-21 103-39-103-39Z" />
      <path className="long-ridge" d="M-102-35H101" />
      <g className="architecture-detail">
        {bays.map((x) => (
          <path className="long-column-v3" d={`M${x}-10v34`} key={x} />
        ))}
        {[-72, -36, 0, 36, 72].map((x) => (
          <g className="punkah" transform={`translate(${x} -5)`} key={x}>
            <path d="M0-8v8M-8 0Q0 6 8 0" />
          </g>
        ))}
        {[-54, -18, 18, 54].map((x) => (
          <g className="basket-chair" transform={`translate(${x} 13)`} key={x}>
            <path d="M0-15v6M-7-8Q0-15 7-8v12Q0 11-7 4Z" />
          </g>
        ))}
      </g>
      <g className="architecture-micro long-floor-pattern">
        {bays.map((x, index) => (
          <path d={`M${x} 0l${index % 2 ? 10 : -10} 23`} key={x} />
        ))}
      </g>
    </g>
  );
}

function Summit() {
  return (
    <g className="building building-summit">
      <InkPlant x={-93} y={31} scale={0.95} />
      <InkPlant x={92} y={29} scale={0.9} />
      <path className="architecture-shadow" d="M-101 21-13 63 103 19 67 82-29 94-111 54Z" />
      <path className="summit-court" d="M-96 12-4-36 94 10 4 66Z" />
      <path className="facade-left" d="M-82-6 0 34v45L-82 38Z" />
      <path className="facade-right" d="M0 34 82-6v44L0 79Z" />
      <path className="roof-under" d="M-98-8 0-63 98-8 0 47Z" />
      <path className="summit-roof" d="M-104-14Q-88-15-76-30L0-76l76 46q12 15 28 16L0 39Z" />
      <path className="summit-roof-tier" d="M-58-48Q-44-48-35-60L0-84l35 24q9 12 23 12L0-18Z" />
      <path className="roof-ridge-v3" d="M-89-12 0 34 89-12M0-70v97" />
      <g className="architecture-detail">
        {[-66, -44, -22, 0, 22, 44, 66].map((x) => (
          <path className="summit-column" d={`M${x} 20v40`} key={x} />
        ))}
        <path
          className="summit-window"
          d="M-55 34h13v16h-13zm21 10h13v16h-13zm42 0h13v16H8zm34-10h13v16H42Z"
        />
        <path className="summit-portal" d="M-12 46Q0 28 12 46v30H-12Z" />
      </g>
      <path className="architecture-micro summit-stair" d="M-32 75 0 91 32 75M-40 83 0 103 40 83" />
      <circle className="roof-finial-v3" cy="-85" r="4" />
    </g>
  );
}

function SpaHangar({
  x,
  y,
  rotation,
  scale = 1,
  patina = false,
}: {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  patina?: boolean;
}) {
  return (
    <g
      className={`spa-hangar ${patina ? "is-patina" : ""}`}
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
    >
      <path className="spa-hangar-body" d="M-21 7Q0-25 21 7v24h-42Z" />
      <path className="spa-hangar-copper" d="M-22 7Q0-28 22 7L17 13Q0-14-17 13Z" />
      <path className="spa-hangar-door" d="M-9 14Q0 0 9 14v17H-9Z" />
      <g className="architecture-detail spa-ribs-v3">
        <path d="M-15 10Q0-15 15 10M-8 5Q0-8 8 5M0-22v53" />
      </g>
    </g>
  );
}

function MiSolLagoon() {
  return (
    <g className="building building-spa">
      <path className="spa-lagoon-v3" d={lagoon} />
      <path
        className="spa-boardwalk"
        d={trace([
          [1957, 500],
          [1937, 568],
          [1937, 660],
          [1920, 720],
          [1905, 790],
        ])}
      />
      {spaPods.map(({ x, y }, index) => (
        <SpaHangar
          key={y}
          x={x}
          y={y}
          rotation={index < 3 ? 15 : 3}
          scale={0.32}
          patina={index % 2 === 0}
        />
      ))}
      {spaVillas.map(({ x, y }, index) => (
        <g key={y} transform={`translate(${x} ${y}) rotate(-27) scale(.36)`}>
          <Villa variant={index % 2} mirror={false} />
        </g>
      ))}
    </g>
  );
}

function RelaxationPavilion() {
  return (
    <g className="building building-relaxation">
      <path className="architecture-shadow" d="M-43 12 1 32 45 10 19 46-25 43Z" />
      <path className="pavilion-platform" d="M-38 8 0-13 39 7 1 30Z" />
      <path className="pavilion-roof-under" d="M-45-6 0-36 46-6 0 23Z" />
      <path className="pavilion-roof" d="M-49-11Q-37-12-29-22L0-43l29 21q8 10 20 11L0 16Z" />
      <g className="architecture-detail">
        {[-24, -10, 10, 24].map((x) => (
          <path className="pavilion-column" d={`M${x} 4v23`} key={x} />
        ))}
        <path className="pavilion-rail" d="M-31 19 0 35 31 19" />
        <Lantern x={0} y={6} color="amber" scale={0.7} />
      </g>
      <circle className="roof-finial-v3" cy="-44" r="3" />
    </g>
  );
}

function SportsCentre() {
  return (
    <g className="building building-sports">
      <path className="architecture-shadow" d="M-77 12 0 50 77 12 45 66-31 69Z" />
      <path className="sports-court-v3" d="M-78 4 0-37 79 3 0 51Z" />
      <path
        className="sports-lines-v3"
        d="M-67 4 0-31 67 3 0 43ZM0-31v74M-34-13l68 35M-52 12l38 20m66-20L14 32"
      />
      <g transform="translate(0 -27) scale(.7)">
        <path className="facade-left" d="M-38 0 0 19v27L-38 27Z" />
        <path className="facade-right" d="M0 19 38 0v27L0 46Z" />
        <path className="sports-roof" d="M-46-4 0-31 46-4 0 24Z" />
        <path
          className="architecture-detail sports-glass"
          d="M-26 12-7 21v14l-19-9Zm33 9 19-9v14L7 35Z"
        />
      </g>
    </g>
  );
}

function ClubLounge() {
  return (
    <g className="building building-club">
      <path className="architecture-shadow" d="M-46 8 0 31 51 6 25 43-22 46Z" />
      <path className="club-pool" d="M-48 15-4-7 48 17 4 42Z" />
      <path className="facade-dark" d="M-34-4 0 13v22L-34 18Z" />
      <path className="facade-right" d="M0 13 35-4v22L0 35Z" />
      <path className="club-roof" d="M-42-7 0-32 43-7 0 19Z" />
      <g className="architecture-detail">
        <path className="club-glass" d="M-25 6-7 15v12l-18-9Zm32 9 18-9v12L7 27Z" />
        <InkPlant x={-17} y={22} scale={0.45} />
        <InkPlant x={18} y={20} scale={0.45} />
      </g>
    </g>
  );
}

function Tingara() {
  return (
    <g className="building building-tingara">
      <path className="architecture-shadow" d="M-43 8 0 29 46 7 21 44-23 43Z" />
      <path className="tingara-deck" d="M-41 5 0-17 42 4 0 29Z" />
      <path className="facade-dark" d="M-30-6 0 9v24L-30 18Z" />
      <path className="facade-right" d="M0 9 31-6v24L0 33Z" />
      <path className="tingara-roof" d="M-39-9Q-28-10-20-18L0-31l20 13q8 8 20 9L0 15Z" />
      <path
        className="architecture-detail shoji"
        d="M-22 5-7 12v14l-15-7Zm29 7 15-7v14L7 26ZM-17 8v13M17 8v13"
      />
      <g className="architecture-micro torii" transform="translate(-7 29)">
        <path d="M-13-12h26M-10-8h20M-7-8v17M7-8V9" />
      </g>
    </g>
  );
}

function MoulinRouge() {
  return (
    <g className="building building-moulin">
      <path className="architecture-shadow" d="M-34 9 1 27 37 8 17 38-21 39Z" />
      <path className="facade-front" d="M-27-8h54v36h-54Z" />
      <path className="moulin-roof" d="M-32-9 0-28 32-9 0 10Z" />
      <path className="moulin-marquee" d="M-24 8h48l-5 12h-38Z" />
      <g className="architecture-detail moulin-clock">
        <circle cy="-8" r="7" />
        <path d="M0-8l4-3M0-8v-5" />
      </g>
      <Lantern x={-17} y={20} color="coral" scale={0.55} />
      <Lantern x={17} y={20} color="coral" scale={0.55} />
    </g>
  );
}

function ApecGarden() {
  return (
    <g className="building building-apec">
      <path className="apec-lawn" d="M-42 1 0-21 43 1 0 27Z" />
      <path className="apec-path" d="M-5 23 0-11 7 22" />
      <g className="architecture-detail apec-sculptures">
        <path d="M-25 8q8-17 13 1l-6 7Zm43-2q5-17 12 0l-6 10Z" />
        <circle cx="0" cy="2" r="5" />
      </g>
    </g>
  );
}

function GardenPool() {
  return (
    <g className="building building-garden-pool">
      <path
        className="garden-pool-water"
        d="M-45 3Q-19-22 18-13 49-6 44 20 35 43-3 41-45 40-49 20-52 11-45 3Z"
      />
      <path className="garden-pool-rim" d="M-39 5Q-17-15 16-8 40-3 37 17 30 34-3 34-38 33-41 18" />
      <g className="architecture-detail pool-cabanas">
        {[-26, 0, 26].map((x) => (
          <path d={`M${x - 9}-8  ${x}-21 ${x + 9}-8 ${x} 0Z`} key={x} />
        ))}
      </g>
    </g>
  );
}

function NailHairStudio() {
  return (
    <g className="building building-studio">
      <path className="architecture-shadow" d="M-30 7 0 22 33 6 15 34-18 34Z" />
      <path className="facade-front" d="M-25-7h50v31h-50Z" />
      <path className="studio-roof" d="M-31-9 0-27 31-9 0 10Z" />
      <path className="studio-awning" d="M-20 5h40l-5 10h-30Z" />
      <path
        className="architecture-detail studio-stripes"
        d="M-17 5-13 15M-9 5-6 15M0 5v10M9 5l-3 10M17 5l-4 10"
      />
      <path className="architecture-micro hanging-boats" d="M-30 4q5 8 10 0M20 3q5 8 10 0" />
    </g>
  );
}

function SpaReception() {
  return (
    <g className="building building-spa-reception">
      <path className="spa-reception-deck" d="M-38 7 0-13 40 7 0 31Z" />
      <path className="facade-dark" d="M-25-6 0 7v25L-25 19Z" />
      <path className="facade-right" d="M0 7 25-6v25L0 32Z" />
      <path className="spa-reception-roof" d="M-31-7Q0-38 31-7L0 12Z" />
      <path className="architecture-detail spa-reception-door" d="M-8 14Q0 2 8 14v17H-8Z" />
    </g>
  );
}

function BeachActivities() {
  return (
    <g className="building building-beach-activities">
      <path className="beach-hut" d="M-24-3h48v28h-48Z" />
      <path className="beach-hut-roof" d="M-31-5 0-23 31-5 0 11Z" />
      <g className="basket-boats">
        <path d="M-43 23q11 15 22 0-11 7-22 0ZM22 24q11 15 22 0-11 7-22 0Z" />
        <path className="architecture-detail" d="M-38 25q6 5 12 0m53 1q6 5 12 0" />
      </g>
    </g>
  );
}

function YogaPavilion() {
  return (
    <g className="building building-yoga">
      <path className="yoga-platform" d="M-34 6 0-13 35 5 0 26Z" />
      <path className="yoga-roof-under" d="M-39-5 0-31 40-5 0 20Z" />
      <path className="yoga-roof" d="M-43-9Q-32-9-25-18L0-37l25 19q7 9 18 9L0 14Z" />
      <g className="architecture-detail yoga-columns">
        {[-22, -8, 8, 22].map((x) => (
          <path d={`M${x} 2v22`} key={x} />
        ))}
      </g>
      <circle className="roof-finial-v3" cy="-38" r="2.6" />
    </g>
  );
}

function OrganicGarden() {
  return (
    <g className="building building-garden">
      <path className="garden-ground" d="M-47 1 0-24 48 0 0 30Z" />
      {[-28, -10, 8, 26].map((x) => (
        <path className="garden-bed" d={`M${x - 9} 4 ${x} -1 ${x + 10} 4 ${x} 10Z`} key={x} />
      ))}
      <path className="nursery-shed" d="M-15-11h30V7h-30Z" />
      <path className="nursery-roof" d="M-20-13 0-25 20-13 0-2Z" />
      <path
        className="architecture-detail garden-sprouts"
        d="M-31 4q3-7 6 0m12-5q3-7 6 0m12 0q3-7 6 0m12 4q3-7 6 0"
      />
    </g>
  );
}

function SpiritHouse() {
  return (
    <g className="building building-spirit-house">
      <path className="spirit-lawn" d="M-38 9 0-12 39 8 0 31Z" />
      <path className="facade-front" d="M-18-7h36v31h-36Z" />
      <path className="spirit-roof-under" d="M-26-9 0-28 27-9 0 8Z" />
      <path className="spirit-roof" d="M-31-13Q-22-14-16-20L0-34l16 14q6 6 16 7L0 4Z" />
      <path className="spirit-door" d="M-6 8H6v16H-6Z" />
      <g className="architecture-detail spirit-flames">
        <path d="M-24 17q-5-8 0-13 5 5 0 13Zm48 0q-5-8 0-13 5 5 0 13Z" />
      </g>
      <circle className="roof-finial-v3" cy="-35" r="2.5" />
    </g>
  );
}

const buildingEntries: BuildingEntry[] = [
  { id: "relaxation-pavilion", Artwork: RelaxationPavilion, scale: 0.28 },
  { id: "yoga-pavilion", Artwork: YogaPavilion, scale: 0.28 },
  { id: "beach-activity-centre", Artwork: BeachActivities, scale: 0.35 },
  { id: "terra-mare", Artwork: TerraMare, scale: 0.48, tier: "hero" },
  { id: "garden-pool", Artwork: GardenPool, scale: 0.32 },
  { id: "long-bar", Artwork: LongBar, scale: 0.44, tier: "hero" },
  { id: "organic-garden", Artwork: OrganicGarden, scale: 0.48 },
  { id: "spirit-house", Artwork: SpiritHouse, scale: 0.25 },
  { id: "nail-hair-studio", Artwork: NailHairStudio, scale: 0.28 },
  { id: "mi-sol-reception", Artwork: SpaReception, scale: 0.3 },
  { id: "heritage-village", Artwork: HeritageVillage, scale: 0.42, tier: "hero" },
  { id: "la-maison-1888", Artwork: LaMaison, scale: 0.43, tier: "hero" },
  { id: "citron", Artwork: Citron, scale: 0.46, tier: "hero" },
  { id: "moulin-rouge", Artwork: MoulinRouge, scale: 0.23 },
  { id: "club-lounge", Artwork: ClubLounge, scale: 0.29 },
  { id: "tingara", Artwork: Tingara, scale: 0.39 },
  { id: "lobby", Artwork: Lobby, scale: 0.43, tier: "hero" },
  { id: "carpark-apec", Artwork: ApecGarden, scale: 0.69 },
  { id: "summit", Artwork: Summit, scale: 0.65, tier: "hero" },
  { id: "sports-centre", Artwork: SportsCentre, scale: 0.65 },
];

export const ArchitectureArtwork = memo(function ArchitectureArtwork({
  places,
  cameraScale,
  selectedId,
  activeFilters,
  mode,
}: Readonly<ArchitectureArtworkProps>) {
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const detailClass = cameraScale >= 1.72 ? "is-close" : cameraScale >= 1.32 ? "is-detailed" : "";

  return (
    <g className={`architecture-layer ${detailClass}`} aria-hidden="true">
      <MiSolLagoon />
      <VillaVillage />
      {[...buildingEntries]
        .sort((a, b) => buildingPlacements[a.id]!.y - buildingPlacements[b.id]!.y)
        .map(({ id, Artwork, scale = 1, tier = "secondary" }) => {
          const place = placeById.get(id);
          if (!place) return null;
          const matchesFilter =
            activeFilters.size === 0 ||
            place.categories.some((category) => activeFilters.has(category));
          const dimmed =
            !matchesFilter || (mode === "tour" && !bensleyTour.some((s) => s.placeId === place.id));
          const selected = selectedId === id;
          return (
            <g
              key={id}
              className={`architecture-site tier-${tier} ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""}`}
              transform={`translate(${buildingPlacements[id]!.x} ${buildingPlacements[id]!.y}) scale(${scale})`}
            >
              <ellipse
                className="architecture-selection"
                rx={tier === "hero" ? 73 : 42}
                ry={tier === "hero" ? 32 : 18}
                cy={tier === "hero" ? 23 : 13}
              />
              <g className="architecture-motion">
                <Artwork />
              </g>
            </g>
          );
        })}
    </g>
  );
});
