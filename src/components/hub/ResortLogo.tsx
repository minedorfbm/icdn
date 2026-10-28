import { imageSource } from "@/lib/image-source";

/** Official resort artwork; every wordmark variant retains the original gold emblem. */
export function ResortLogo({
  tone = "dark",
  className = "",
  loading = "lazy",
  fetchPriority,
}: Readonly<{
  tone?: "dark" | "light" | "black";
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}>) {
  return (
    <img
      src={imageSource(`/intercontinental-danang-logo-${tone}.svg`)}
      alt="InterContinental Danang Sun Peninsula Resort"
      width={1230}
      height={384}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={`resort-logo ${className}`}
    />
  );
}
