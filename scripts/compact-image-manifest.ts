import fs from "node:fs/promises";

const bucket = "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
type Candidate = { src: string; width: number };
type Image = {
  width: number;
  height: number;
  aliases: string[];
  variants: Candidate[];
  avif?: Candidate;
  avifVariants?: Candidate[];
};

/** Keep the complete audit manifest in Git, but ship only rendering data to visitors. */
export function compactImageManifest(manifest: Record<string, Image>) {
  const relative = (source: string) => {
    if (!source.startsWith(bucket)) throw new Error("Managed image must be in the public bucket");
    return source.slice(bucket.length);
  };
  const pair = (candidate: Candidate): [string, number] => [
    relative(candidate.src),
    candidate.width,
  ];
  return Object.fromEntries(
    Object.entries(manifest).map(([source, image]) => [
      relative(source),
      {
        width: image.width,
        height: image.height,
        aliases: image.aliases
          .filter((alias) => alias !== source)
          .map((alias) => (alias.startsWith(bucket) ? "$" + relative(alias) : alias)),
        variants: image.variants.map(pair),
        ...(image.avif ? { avif: [...(image.avifVariants ?? []), image.avif].map(pair) } : {}),
      },
    ]),
  );
}

if (import.meta.main) {
  const manifest = JSON.parse(
    await fs.readFile(new URL("../src/data/image-variants.json", import.meta.url), "utf8"),
  );
  await fs.writeFile(
    new URL("../src/data/image-variants-runtime.json", import.meta.url),
    JSON.stringify(compactImageManifest(manifest)) + "\n",
  );
}
