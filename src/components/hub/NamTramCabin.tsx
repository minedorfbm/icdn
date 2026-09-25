/** A legible miniature of the Nam Tram's boat hull, broad roof and slender posts. */
export function NamTramCabin() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 34"
      fill="var(--tram-ebony)"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="nam-tram-cabin"
    >
      <path d="M8 10v13M32 10v13" />
      <path d="M2 10Q9 5 20 2Q31 5 38 10Q20 13 2 10Z" />
      <path d="M8 19h24" strokeOpacity=".65" />
      <path d="M2 20Q20 28 38 20L35 28Q32 32 20 32Q8 32 5 28Z" />
      <path d="M8 28Q20 32 32 28" strokeOpacity=".45" />
      <path d="M15 33h10" />
    </svg>
  );
}
