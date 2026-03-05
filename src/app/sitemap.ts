import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://ciphermeet.io',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'https://ciphermeet.io/faq',
      lastModified: new Date(),
      priority: 0.7,
    },
  ];
}
