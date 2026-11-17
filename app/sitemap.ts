import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy", "/terms", "/data-deletion"].map((p) => ({
    url: `${SITE_URL}${p}`,
  }))
}
