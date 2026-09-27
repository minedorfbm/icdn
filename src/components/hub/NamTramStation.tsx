/** A small open pavilion and double landing, legible inside the mobile rail. */
export function NamTramStation({ active = false }: Readonly<{ active?: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="nam-tram-stop"
      data-active={active}
    >
      <path d="M4 9 16 3 28 9 25 11H7Z" className="nam-tram-station-roof" />
      <path d="M7 11h18v11H7Z" fill="var(--tram-ebony)" />
      <path d="M12 13v7m8-7v7" opacity=".55" />
      <path d="M3 22h26M6 25h20" className="nam-tram-station-landing" />
    </svg>
  );
}
