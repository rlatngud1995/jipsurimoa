import type { MetadataRoute } from "next";

const SITE_URL = "https://www.jipsurimoa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",

        allow: "/",

        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
        ],
      },
    ],

    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/services-sitemap.xml`,
    ],

    host: SITE_URL,
  };
}
