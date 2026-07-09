import type { MetadataRoute } from "next";
import { resolveBaseUrl } from "@/lib/constants";
import { getActresses, getGenres, getLabels, getMakers, getSeriesList, getWorks } from "@/lib/data";
import { TOPICS } from "@/lib/topics-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  const [works, actresses, makers, labels, seriesList, genres] = await Promise.all([
    getWorks({ limit: 5000 }),
    getActresses(),
    getMakers(),
    getLabels(),
    getSeriesList(),
    getGenres(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/works`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/actresses`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/makers`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/labels`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/series`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/genres`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/platforms`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/ranking`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/used-market`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/used-market/ranking`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/topics`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/guides/payments`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/guides/payments/china`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/guides/payments/taiwan`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/guides/payments/korea`, changeFrequency: "monthly", priority: 0.4 },
  ];

  for (const topic of TOPICS) entries.push({ url: `${baseUrl}/topics/${topic.slug}`, changeFrequency: "weekly", priority: 0.6 });

  for (const work of works) entries.push({ url: `${baseUrl}/works/${work.slug}`, changeFrequency: "weekly", priority: 0.8 });
  for (const actress of actresses) entries.push({ url: `${baseUrl}/actresses/${actress.slug}`, changeFrequency: "weekly", priority: 0.6 });
  for (const maker of makers) entries.push({ url: `${baseUrl}/makers/${maker.slug}`, changeFrequency: "weekly", priority: 0.5 });
  for (const label of labels) entries.push({ url: `${baseUrl}/labels/${label.slug}`, changeFrequency: "weekly", priority: 0.5 });
  for (const series of seriesList) entries.push({ url: `${baseUrl}/series/${series.slug}`, changeFrequency: "weekly", priority: 0.5 });
  for (const genre of genres) entries.push({ url: `${baseUrl}/genres/${genre.slug}`, changeFrequency: "weekly", priority: 0.4 });

  return entries;
}
