
import type { MetadataRoute } from "next";

const SITE_URL = "https://www.jipsurimoa.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/companies`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
