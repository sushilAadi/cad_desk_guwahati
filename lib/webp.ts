/**
 * Returns a WebP URL for any image we show. Cloudinary: asked for webp directly. Other hosts and our own
 * /public files: routed through Next's image optimiser, which serves WebP to browsers that accept it.
 * Pass absolute=true for metadata/JSON-LD. Already-webp and data: URLs are left alone.
 */
export function webp(src: string, w = 640, absolute = false): string {
  if (!src || src.startsWith("data:") || /\.webp(\?|$)/i.test(src)) return src
  if (src.includes("res.cloudinary.com") && src.includes("/upload/"))
    return src.replace("/upload/", `/upload/f_webp,q_auto,w_${w}/`)
  if (absolute) return src // OG tags and JSON-LD need a full URL; only Cloudinary can be converted at the source
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
}

/** srcset of WebP sizes (widths are all valid Next optimiser sizes). */
export const WEBP_WIDTHS = [640, 1080, 1920]
export const webpSet = (src: string) => WEBP_WIDTHS.map((w) => `${webp(src, w)} ${w}w`).join(", ")
