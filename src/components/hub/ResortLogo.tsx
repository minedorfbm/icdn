/** Official resort artwork; the light wordmark retains the original gold emblem. */
export function ResortLogo({
  tone = "dark",
  className = "",
  loading = "lazy",
}: Readonly<{
  tone?: "dark" | "light" | "gold";
  className?: string;
  loading?: "eager" | "lazy";
}>) {
  return (
    <img
      src={`/intercontinental-danang-logo-${tone}.svg`}
      alt="InterContinental Danang Sun Peninsula Resort"
      width={1230}
      height={384}
      loading={loading}
      decoding="async"
      className={`resort-logo ${className}`}
    />
  );
}
