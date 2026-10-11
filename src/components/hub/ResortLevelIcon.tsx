import type { Level } from "@/data/resort";

/** Resort signage redrawn from the supplied references; inherits the level palette. */
export function ResortLevelIcon({ level, className }: { level: Level; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      {level === "heaven" && (
        <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
          <ellipse cx="32" cy="10.5" rx="15.5" ry="4.5" />
          <circle cx="32" cy="42.5" r="17.5" />
        </g>
      )}
      {level === "earth" && (
        <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
          <circle cx="32" cy="32" r="24" />
          <path d="M32 8v48M8 32h48" />
        </g>
      )}
      {level === "sea" && (
        <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 43.6a24 24 0 1 1 42 0" />
          <path d="M10 51c5.2 1.1 9-.3 12-3.5 5.4 7 11.6 7 17 0 4.5 6.3 10.4 7 16 2" />
        </g>
      )}
      {level === "sky" && (
        <>
          <path
            d="M9 37v-5a23 23 0 0 1 46 0v5"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M8 37c-1-4 4-7 8-4 3-2 6-1 8 2 3-3 6-2 8 1 3-3 6-3 9-1 3-3 7-3 10 0 5-2 9 2 8 6 5 4 4 10-1 12-1 5-6 6-10 4-3 2-7 2-10 0-4 2-7 2-10 0-3 2-7 2-10 0-5 2-9 0-10-4-5-2-7-7-4-11-1-2 1-4 4-5Z"
            fill="currentColor"
          />
        </>
      )}
    </svg>
  );
}
