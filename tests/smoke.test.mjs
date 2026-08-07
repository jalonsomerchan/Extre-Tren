import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function readText(path) {
  return readFileSync(join(root, path), 'utf8');
}

function parseConstString(source, name) {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*['\"]([^'\"]+)['\"]`));
  assert.ok(match, `Could not find exported const ${name}`);

  return match[1];
}

function parseConstStringArray(source, name) {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\[([^\\]]+)\\]`));
  assert.ok(match, `Could not find exported array const ${name}`);

  const values = [...match[1].matchAll(/['\"]([^'\"]+)['\"]/g)].map(([, value]) => value);
  assert.ok(values.length > 0, `${name} should contain at least one value`);

  return values;
}

function getConfiguredI18n() {
  const siteConfig = readText('src/config/site.ts');

  return {
    defaultLocale: parseConstString(siteConfig, 'defaultLocale'),
    locales: parseConstStringArray(siteConfig, 'locales'),
  };
}

describe('project smoke checks', () => {
  it('has the minimum files needed by Astro', () => {
    [
      'package.json',
      'astro.config.mjs',
      'src/pages/index.astro',
      'src/pages/[locale]/index.astro',
      'src/pages/[...section].astro',
      'src/pages/[locale]/[...section].astro',
      'src/pages/dia/[date].astro',
      'src/pages/[locale]/dia/[date].astro',
      'src/pages/semana/[period].astro',
      'src/pages/mes/[period].astro',
      'src/pages/[locale]/semana/[period].astro',
      'src/pages/[locale]/mes/[period].astro',
      'src/pages/viaje/[train].astro',
      'src/pages/[locale]/viaje/[train].astro',
      'src/pages/viaje/[train]/dia/[date].astro',
      'src/pages/[locale]/viaje/[train]/dia/[date].astro',
      'src/pages/404.astro',
      'src/pages/manifest.webmanifest.ts',
      'src/pages/robots.txt.ts',
      'public/CNAME',
      'public/sw.js',
      'public/icons/icon-192.png',
      'public/icons/icon-512.png',
      'public/icons/icon-maskable-512.png',
      'public/icons/apple-touch-icon.png',
      'src/layouts/BaseLayout.astro',
      'src/config/site.ts',
      'src/i18n/ui.ts',
      'src/i18n/translations',
      'src/utils/paths.ts',
      'src/styles/global.css',
      'src/data/renfe-extremadura.json',
      'scripts/update-extremadura-data.mjs',
    ].forEach((path) => {
      assert.equal(existsSync(join(root, path)), true, `${path} should exist`);
    });
  });

  it('keeps template metadata files available', () => {
    ['.nvmrc', '.env.example', '.gitignore', '.prettierrc', '.prettierignore', 'README.md'].forEach(
      (path) => {
        assert.equal(existsSync(join(root, path)), true, `${path} should exist`);
      }
    );
  });

  it('keeps the expected npm scripts available', () => {
    const pkg = readJson('package.json');

    assert.equal(pkg.scripts?.dev, 'astro dev');
    assert.equal(pkg.scripts?.build, 'astro build');
    assert.equal(pkg.scripts?.preview, 'astro preview');
    assert.ok(pkg.scripts?.test?.includes('node --test'));
    assert.equal(pkg.scripts?.['data:sync:all'], 'node scripts/update-extremadura-data.mjs --all');
    assert.ok(pkg.scripts?.clean?.includes('scripts/clean.mjs'));
  });

  it('keeps basic template components available', () => {
    ['Container', 'DataPage', 'DayDetailPage', 'DelayBadge', 'DelayDistribution', 'DelayLegend', 'DelayTrendChart', 'Footer', 'Header', 'JourneyDayHistoryPage', 'JourneyHistoryPage', 'JourneyStops', 'MetricCards', 'ObservationTimeline', 'PageHero', 'PeriodPicker', 'RouteMap', 'SummaryBars', 'TodayLiveTable', 'TrainTable'].forEach((component) => {
      assert.equal(
        existsSync(join(root, `src/components/${component}.astro`)),
        true,
        `${component}.astro should exist`
      );
    });
  });

  it('keeps Astro i18n enabled and aligned with site config', () => {
    const astroConfig = readText('astro.config.mjs');
    const readme = readText('README.md');
    const { defaultLocale, locales } = getConfiguredI18n();

    assert.match(astroConfig, /i18n/);
    assert.match(astroConfig, new RegExp(`defaultLocale:\\s*['\"]${defaultLocale}['\"]`));

    locales.forEach((locale) => {
      assert.match(
        astroConfig,
        new RegExp(`['\"]${locale}['\"]`),
        `${locale} should be configured in Astro i18n locales`
      );
      assert.equal(
        existsSync(join(root, `src/i18n/translations/${locale}.json`)),
        true,
        `${locale}.json should exist`
      );
    });

    assert.match(readme, /Traducciones e idiomas/);
    assert.match(readme, /src\/i18n\/translations/);
  });

  it('keeps translation files aligned with configured locales', () => {
    const { defaultLocale, locales } = getConfiguredI18n();
    const defaultTranslations = readJson(`src/i18n/translations/${defaultLocale}.json`);
    const expectedKeys = Object.keys(defaultTranslations).sort();
    const translationFiles = readdirSync(join(root, 'src/i18n/translations'))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''));

    assert.deepEqual(
      [...translationFiles].sort(),
      [...locales].sort(),
      'translation JSON files should match configured locales'
    );

    locales.forEach((locale) => {
      const translations = readJson(`src/i18n/translations/${locale}.json`);
      assert.deepEqual(
        Object.keys(translations).sort(),
        expectedKeys,
        `${locale}.json keys should match ${defaultLocale}.json`
      );
      assert.ok(translations['today.title'], `${locale}.json should include today.title`);
      assert.ok(translations['nav.main'], `${locale}.json should include nav.main`);
    });
  });

  it('keeps routing and assets compatible with root and subpath deployments', () => {
    const layout = readText('src/layouts/BaseLayout.astro');
    const manifest = readText('src/pages/manifest.webmanifest.ts');
    const robots = readText('src/pages/robots.txt.ts');
    const i18nHelper = readText('src/i18n/ui.ts');
    const pathHelpers = readText('src/utils/paths.ts');

    [layout, manifest, robots, i18nHelper].forEach((source) => {
      assert.match(source, /withBasePath|getLocalizedPath|stripBasePath/);
      assert.doesNotMatch(source, /href=\"\//);
      assert.doesNotMatch(source, /src=\"\//);
    });

    assert.match(pathHelpers, /withBasePath/);
    assert.match(pathHelpers, /stripBasePath/);
    assert.match(pathHelpers, /getAbsoluteUrl/);
    assert.match(manifest, /start_url/);
    assert.match(robots, /sitemap-index\.xml/);
  });

  it('keeps the PWA shell available', () => {
    const layout = readText('src/layouts/BaseLayout.astro');
    const manifest = readText('src/pages/manifest.webmanifest.ts');
    const serviceWorker = readText('public/sw.js');

    assert.match(layout, /data-app-loader/);
    assert.match(layout, /serviceWorker\.register/);
    assert.match(layout, /5 \* 60 \* 1000/);
    assert.match(layout, /visibilitychange/);
    assert.match(layout, /location\.reload/);
    assert.match(layout, /apple-touch-icon/);
    assert.match(manifest, /icon-192\.png/);
    assert.match(manifest, /icon-512\.png/);
    assert.match(manifest, /purpose: 'maskable'/);
    assert.match(serviceWorker, /self\.addEventListener\('fetch'/);
  });

  it('keeps ExtreTren metadata, sections and data sources configured', () => {
    const siteConfig = readText('src/config/site.ts');
    const header = readText('src/components/Header.astro');
    const dataPage = readText('src/components/DataPage.astro');
    const dataScript = readText('scripts/update-extremadura-data.mjs');

    assert.match(siteConfig, /repositoryUrl/);
    assert.match(siteConfig, /ExtreTren/);
    assert.match(header, /t\('nav\.main'\)/);
    assert.match(dataPage, /section === 'today'/);
    assert.match(dataScript, /EXTREMADURA_STOP_IDS/);
    assert.match(dataScript, /josernalist\/renfe-gtfsrt/);
    assert.match(dataScript, /getAllAvailableDates/);
  });

  it('keeps today live data able to add newly published services', () => {
    const liveTable = readText('src/components/TodayLiveTable.astro');
    const delays = readText('src/data/delays.ts');

    assert.match(delays, /getLiveTrainCatalog/);
    assert.match(liveTable, /trainCatalog\[trainNumber\]/);
    assert.match(liveTable, /setInterval\(refresh, 5 \* 60 \* 1000\)/);
    assert.match(liveTable, /parseCsv\(await response\.text\(\)\)/);
  });

  it('includes GitHub workflows for CI and Pages', () => {
    const pagesWorkflow = readText('.github/workflows/pages.yml');
    const ciWorkflow = readText('.github/workflows/ci.yml');
    const dataWorkflow = readText('.github/workflows/data-refresh.yml');
    const astroConfig = readText('astro.config.mjs');

    assert.match(pagesWorkflow, /actions\/deploy-pages@v4/);
    assert.match(astroConfig, /https:\/\/extretren\.alon\.one/);
    assert.match(pagesWorkflow, /ASTRO_SITE:\s*https:\/\/extretren\.alon\.one/);
    assert.match(pagesWorkflow, /ASTRO_BASE:\s*\//);
    assert.match(pagesWorkflow, /npm run build/);
    assert.match(pagesWorkflow, /npm test/);
    assert.match(ciWorkflow, /pull_request/);
    assert.match(ciWorkflow, /npm run build/);
    assert.match(ciWorkflow, /npm test/);
    assert.match(dataWorkflow, /schedule/);
    assert.match(dataWorkflow, /ASTRO_SITE:\s*https:\/\/extretren\.alon\.one/);
    assert.match(dataWorkflow, /ASTRO_BASE:\s*\//);
    assert.match(dataWorkflow, /update-extremadura-data/);
    assert.match(dataWorkflow, /actions\/deploy-pages@v4/);
  });

  it('keeps useful project documentation available', () => {
    const readme = readText('README.md');

    assert.match(readme, /\S/, 'README.md should not be empty');
    assert.equal(existsSync(join(root, 'agents.md')), true, 'agents.md should exist');
    assert.equal(existsSync(join(root, 'docs/design-system.md')), true, 'docs/design-system.md should exist');
    assert.equal(existsSync(join(root, 'docs/data-pipeline.md')), true, 'docs/data-pipeline.md should exist');
  });
});
