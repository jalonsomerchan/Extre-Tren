import delayData from './renfe-extremadura.json';

export type TrainStatus = 'SCHEDULED' | 'CANCELED' | 'SUSPENDED';
export type DelayState = 'onTime' | 'minor' | 'major' | 'severe' | 'cancelled' | 'suspended' | 'unknown';

export interface RouteStop {
  name: string;
  time: string;
  latitude: number | null;
  longitude: number | null;
}

// Formato compacto: fecha UTC y demora en minutos. Las observaciones CANCELED se descartan.
export type TrainObservation = [observedAt: string, delayMinutes: number | null];

export interface TrainRecord {
  tripId: string;
  trainNumber: string;
  date: string;
  status: TrainStatus;
  maxDelayMinutes: number | null;
  lastDelayMinutes: number | null;
  observedAt: string;
  samples: number;
  observations: TrainObservation[];
  origin: string;
  destination: string;
  departure: string;
  routeStops: RouteStop[];
  extremaduraStops: string[];
}

export interface DelayDay {
  date: string;
  sourceUrl: string;
  records: TrainRecord[];
}

interface DelayDataset {
  updatedAt: string | null;
  source: { gtfs: string; history: string };
  days: DelayDay[];
}

const dataset = delayData as DelayDataset;

export const delayDataset = dataset;

export function getAvailableDays() {
  return [...dataset.days].sort((left, right) => left.date.localeCompare(right.date));
}

export function getLatestDay() {
  return getAvailableDays().at(-1);
}

export function getAvailableTrainNumbers() {
  return [...new Set(dataset.days.flatMap((day) => day.records.map((record) => record.trainNumber)))].sort();
}

export function getTrainHistory(trainNumber: string) {
  return dataset.days
    .flatMap((day) => day.records)
    .filter((record) => record.trainNumber === trainNumber)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function getJourneyDay(trainNumber: string, date: string) {
  return dataset.days
    .find((day) => day.date === date)
    ?.records.find((record) => record.trainNumber === trainNumber);
}

export function getAvailableJourneyDays() {
  return dataset.days.flatMap((day) => day.records.map((record) => ({
    trainNumber: record.trainNumber,
    date: day.date,
  })));
}

export function getRecentDays(count: number) {
  return getAvailableDays().slice(-count);
}

export function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function getWeekKey(date: string) {
  const currentDate = new Date(`${date}T12:00:00Z`);
  const day = currentDate.getUTCDay() || 7;
  currentDate.setUTCDate(currentDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((currentDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${currentDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function getAvailableWeeks() {
  return [...new Set(getAvailableDays().map((day) => getWeekKey(day.date)))].reverse();
}

export function getAvailableMonths() {
  return [...new Set(getAvailableDays().map((day) => getMonthKey(day.date)))].reverse();
}

export function getDaysForWeek(week: string) {
  return getAvailableDays().filter((day) => getWeekKey(day.date) === week);
}

export function getDaysForMonth(month: string) {
  return getAvailableDays().filter((day) => getMonthKey(day.date) === month);
}

export function getCurrentMonthDays() {
  const latestMonth = getAvailableMonths()[0];

  if (!latestMonth) return [];

  return getDaysForMonth(latestMonth);
}

export function getDelayStateForMinutes(delay: number | null): Exclude<DelayState, 'cancelled' | 'suspended'> {
  if (delay === null) return 'unknown';
  if (delay <= 4) return 'onTime';
  if (delay <= 14) return 'minor';
  if (delay <= 29) return 'major';
  return 'severe';
}

export function getDelayState(record: TrainRecord): DelayState {
  if (record.status === 'SUSPENDED') return 'suspended';
  if (record.status === 'CANCELED') return 'cancelled';
  return getDelayStateForMinutes(record.maxDelayMinutes);
}

export function getDisplayedDelay(record: TrainRecord) {
  return record.status === 'SUSPENDED' ? record.lastDelayMinutes ?? record.maxDelayMinutes : record.maxDelayMinutes;
}

export function getDaySummary(records: TrainRecord[]) {
  const active = records.filter((record) => record.status === 'SCHEDULED');
  const delayValues = active
    .map((record) => record.maxDelayMinutes)
    .filter((delay): delay is number => delay !== null);
  const cancelled = records.filter((record) => record.status !== 'SCHEDULED').length;
  const punctual = active.filter((record) => (record.maxDelayMinutes ?? Infinity) <= 4).length;

  return {
    services: records.length,
    cancelled,
    punctual,
    average: delayValues.length
      ? Math.round((delayValues.reduce((total, delay) => total + delay, 0) / delayValues.length) * 10) / 10
      : null,
    worst: delayValues.length ? Math.max(...delayValues) : null,
  };
}

export function getRouteSummary(days: DelayDay[]) {
  const routes = new Map<string, { route: string; delay: number; services: number }>();

  days.flatMap((day) => day.records).forEach((record) => {
    if (record.status === 'CANCELED' || record.maxDelayMinutes === null) return;
    const route = `${record.origin} — ${record.destination}`;
    const current = routes.get(route) ?? { route, delay: 0, services: 0 };
    current.delay += record.maxDelayMinutes;
    current.services += 1;
    routes.set(route, current);
  });

  return [...routes.values()]
    .map((route) => ({ ...route, average: Math.round((route.delay / route.services) * 10) / 10 }))
    .sort((left, right) => right.average - left.average)
    .slice(0, 6);
}

export function getStationSummary(days: DelayDay[]) {
  const stations = new Map<string, number>();

  days.flatMap((day) => day.records).forEach((record) => {
    record.extremaduraStops.forEach((station) => {
      stations.set(station, (stations.get(station) ?? 0) + 1);
    });
  });

  return [...stations.entries()]
    .map(([station, services]) => ({ station, services }))
    .sort((left, right) => right.services - left.services)
    .slice(0, 12);
}
