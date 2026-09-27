import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api", "/support/", "/checkout", "/login", "/offerte/", "/factuur/", "/demo/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
