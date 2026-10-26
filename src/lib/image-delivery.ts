/** These versioned files are immutable derivatives already published in Supabase. */
export const imageBucket =
  "https://cxcffaegqyvbhrpzpowa.supabase.co/storage/v1/object/public/hub-images/";
export const imageDeliveryPrefix = "/media/";
export const immutableImageName = /^adj-[a-f0-9]{24}-(?:\d+|native|original)\.(?:webp|avif|png)$/;

export function imageDeliveryUrl(source: string): string {
  if (!source.startsWith(imageBucket)) return source;
  const name = source.slice(imageBucket.length);
  return immutableImageName.test(name) ? imageDeliveryPrefix + name : source;
}
