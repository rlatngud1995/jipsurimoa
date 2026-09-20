
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/register"],
    },
    sitemap:
      "https://www.jipsurimoa.com/sitemap.xml",
  };
}
