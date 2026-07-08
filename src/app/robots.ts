import type { MetadataRoute } from "next";
import { resolveBaseUrl } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/go/", "/admin", "/api/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
