import type { ImgHTMLAttributes } from "react";
import { responsiveAvif, responsiveImage } from "@/lib/responsive-image";

/** The wrapper has no layout box, so existing image geometry and gestures are retained. */
export function ResponsivePhoto({
  source,
  sizes,
  ...props
}: Readonly<
  Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
    source: string;
    sizes: string;
  }
>) {
  const avif = responsiveAvif(source, sizes);
  return (
    <picture className="contents">
      {avif && <source type="image/avif" srcSet={avif.srcSet} sizes={avif.sizes} />}
      <img {...responsiveImage(source, sizes)} {...props} alt={props.alt ?? ""} />
    </picture>
  );
}
