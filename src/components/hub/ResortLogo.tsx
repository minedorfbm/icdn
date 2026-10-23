import { HERO_LANDSCAPE_MEDIA } from "@/lib/hero-media";

/** Official resort artwork; the light wordmark retains the original gold emblem. */
export function ResortLogo({
  tone = "dark",
  landscapeTone,
  className = "",
  loading = "lazy",
}: Readonly<{
  tone?: "dark" | "light";
  landscapeTone?: "dark" | "light";
  className?: string;
  loading?: "eager" | "lazy";
}>) {
  return (
    <picture className={`resort-logo ${className}`}>
      {landscapeTone && (
        <source
          media={HERO_LANDSCAPE_MEDIA}
          srcSet={`/intercontinental-danang-logo-${landscapeTone}.svg`}
        />
      )}
      <img
        src={`/intercontinental-danang-logo-${tone}.svg`}
        alt="InterContinental Danang Sun Peninsula Resort"
        width={1230}
        height={384}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
