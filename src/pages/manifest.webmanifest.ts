import { defaultLocale, siteConfig } from '../config/site';
import { useTranslations } from '../i18n/ui';
import { getBasePath, withBasePath } from '../utils/paths';

export function GET() {
  const t = useTranslations(defaultLocale);

  const manifest = {
    name: siteConfig.name,
    short_name: 'ExtreTren',
    description: t('site.description'),
    id: getBasePath(),
    start_url: getBasePath(),
    scope: getBasePath(),
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'portrait-primary',
    background_color: '#f7f8fa',
    theme_color: '#2457d6',
    categories: ['travel', 'utilities'],
    icons: [
      {
        src: withBasePath('icons/icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: withBasePath('icons/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: withBasePath('icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
