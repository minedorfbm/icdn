/** These versioned files are immutable derivatives already published in Supabase. */
export const imageBucket =
  "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
export const officialLogoHashes: Readonly<Record<string, string>> = {
  "adj-470c69370f176b374b8c8bb1-original.svg":
    "470c69370f176b374b8c8bb1e4b5f5f15c2b72350016ff79598412c0c41347e4",
  "adj-a34ea4e7b1b6238453d816fe-original.svg":
    "a34ea4e7b1b6238453d816fecfcd2f0e375c6a2e9ec074e770923a8e77ea0eb9",
  "adj-f7a1a68f80f2abaac5654cf7-original.svg":
    "f7a1a68f80f2abaac5654cf7edafa71069a1e5234867f80d6b356570a896abfa",
};
export const imageDeliveryPrefix = "/media/";
export const immutableImageName = /^adj-[a-f0-9]{24}-(?:\d+|native|original)\.(?:webp|avif|png)$/;

export function imageDeliveryUrl(source: string): string {
  if (!source.startsWith(imageBucket)) return source;
  const name = source.slice(imageBucket.length);
  return immutableImageName.test(name) || Object.hasOwn(officialLogoHashes, name)
    ? imageDeliveryPrefix + name
    : source;
}
