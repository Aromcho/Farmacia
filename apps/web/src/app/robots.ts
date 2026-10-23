import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/media';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/pedido'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
