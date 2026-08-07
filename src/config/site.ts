export const defaultLocale = 'es' as const;
export const locales = ['es', 'en'] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

export const siteConfig = {
  name: 'ExtreTren',
  description: 'Demoras, cancelaciones y estadísticas de los trenes que circulan por Extremadura.',
  url: import.meta.env.ASTRO_SITE ?? 'https://jalonsomerchan.github.io',
  base: import.meta.env.ASTRO_BASE ?? '/',
  repositoryUrl: import.meta.env.PUBLIC_REPOSITORY_URL ?? 'https://github.com/jorgealonso/Extre-Tren',
  author: 'Jorge Alonso',
  defaultLocale,
  locales,
};

export type SiteConfig = typeof siteConfig;
