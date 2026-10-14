import { Helmet } from 'react-helmet-async';
import { publicSiteUrl } from '../lib/supabase';

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export default function Seo({
  title,
  description,
  path,
  image,
  noIndex = false,
  jsonLd,
}: SeoProps) {
  const canonical = publicSiteUrl() + (path || window.location.pathname);
  const socialImage = image || publicSiteUrl() + '/Logo%20Agenzia%20Casadibari.webp';
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Casadibari Immobiliare" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
