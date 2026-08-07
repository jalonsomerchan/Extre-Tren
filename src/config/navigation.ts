import type { TranslationKey } from '../i18n/ui';

export const sections = [
  { id: 'today', path: '/', label: 'nav.today' },
  { id: 'week', path: '/semana/', label: 'nav.week' },
  { id: 'month', path: '/mes/', label: 'nav.month' },
  { id: 'statistics', path: '/estadisticas/', label: 'nav.statistics' },
  { id: 'trains', path: '/trenes/', label: 'nav.trains' },
  { id: 'stations', path: '/estaciones/', label: 'nav.stations' },
  { id: 'methodology', path: '/metodologia/', label: 'nav.methodology' },
] as const satisfies ReadonlyArray<{ id: string; path: string; label: TranslationKey }>;

export type SectionId = (typeof sections)[number]['id'];

export function isSectionId(value: string | undefined): value is SectionId {
  return sections.some((section) => section.id === value);
}
