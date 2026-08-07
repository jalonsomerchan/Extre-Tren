// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

const site = process.env.ASTRO_SITE ?? 'https://extretren.alon.one';
const base = process.env.ASTRO_BASE ?? '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx(), sitemap(), icon()]

});
