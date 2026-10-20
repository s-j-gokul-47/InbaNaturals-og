import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = 'InbaNaturals – Pure Botanical Beauty',
  description = 'InbaNaturals crafts premium natural beauty products for hair and skin — free from harmful chemicals, full of botanical love.',
  image = 'https://www.inbanaturals.com/og-image.png',
  url,
}: SEOProps) {
  const fullTitle = title.includes('InbaNaturals') ? title : `${title} | InbaNaturals`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
