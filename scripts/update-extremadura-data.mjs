import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parseCsv } from './lib/csv.mjs';

const execute = promisify(execFile);
const GTFS_URL = 'https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip';
const HISTORY_RAW_URL = 'https://raw.githubusercontent.com/josernalist/renfe-gtfsrt/master/data';
const HISTORY_TREE_URL = 'https://api.github.com/repos/josernalist/renfe-gtfsrt/git/trees/master?recursive=1';
const OUTPUT_PATH = new URL('../src/data/renfe-extremadura.json', import.meta.url);

// IDs de paradas de Extremadura presentes en el GTFS de Renfe. Se mantienen explícitos
// para evitar incluir estaciones limítrofes por una simple caja de coordenadas.
const EXTREMADURA_STOP_IDS = new Set([
  '30000', '30002', '35206', '35207', '35301', '35302', '35303', '35400', '35402', '35405', '35406',
  '37311', '37400', '37402', '37404', '37406', '37407', '37409', '37410', '37500', '37603', '37604',
  '37606', '37608', '37611', '40002', '40004', '40005', '40006', '40008', '40100', '40105', '40107',
]);

function getDefaultDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getTargetDate() {
  const dateFlag = process.argv.indexOf('--date');
  const value = dateFlag >= 0 ? process.argv[dateFlag + 1] : getDefaultDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) throw new Error('Usa --date YYYY-MM-DD.');
  return value;
}

async function getAllAvailableDates() {
  const response = await fetch(HISTORY_TREE_URL, { headers: { 'user-agent': 'ExtreTren data updater' } });
  if (!response.ok) throw new Error(`No se pudo consultar el histórico (${response.status}).`);
  const tree = await response.json();
  if (tree.truncated) throw new Error('El listado del histórico está truncado; usa --date para importar por partes.');

  const dates = tree.tree
    .map((entry) => entry.path.match(/^data\/\d{4}\/\d{2}\/gtfsrt-(\d{4}-\d{2}-\d{2})\.csv$/)?.[1])
    .filter(Boolean)
    .sort();
  if (!dates.length) throw new Error('No se encontraron CSV diarios en el histórico.');
  return dates;
}

async function getTargetDates() {
  return process.argv.includes('--all') ? getAllAvailableDates() : [getTargetDate()];
}

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function getRawUrl(date) {
  const [year, month] = date.split('-');
  return `${HISTORY_RAW_URL}/${year}/${month}/gtfsrt-${date}.csv`;
}

async function download(url, destination) {
  const response = await fetch(url, { headers: { 'user-agent': 'ExtreTren data updater' } });
  if (!response.ok) throw new Error(`No se pudo descargar ${url} (${response.status}).`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function readGtfsFile(zipPath, fileName) {
  const { stdout } = await execute('unzip', ['-p', zipPath, fileName], { maxBuffer: 40 * 1024 * 1024 });
  return stdout;
}

async function getScheduleIndex(zipPath) {
  const [stopsText, stopTimesText] = await Promise.all([
    readGtfsFile(zipPath, 'stops.txt'),
    readGtfsFile(zipPath, 'stop_times.txt'),
  ]);
  const stops = new Map(parseCsv(stopsText).map((stop) => [stop.stop_id, {
    name: stop.stop_name,
    latitude: Number(stop.stop_lat),
    longitude: Number(stop.stop_lon),
  }]));
  const tripStops = new Map();

  parseCsv(stopTimesText).forEach((row) => {
    if (!EXTREMADURA_STOP_IDS.has(row.stop_id)) return;
    const existing = tripStops.get(row.trip_id) ?? [];
    const stop = stops.get(row.stop_id);
    existing.push({
      name: stop?.name ?? row.stop_id,
      latitude: stop?.latitude ?? null,
      longitude: stop?.longitude ?? null,
      sequence: Number(row.stop_sequence),
      time: row.departure_time || row.arrival_time,
    });
    tripStops.set(row.trip_id, existing);
  });

  const allStopTimes = new Map();
  parseCsv(stopTimesText).forEach((row) => {
    if (!tripStops.has(row.trip_id)) return;
    const existing = allStopTimes.get(row.trip_id) ?? [];
    const stop = stops.get(row.stop_id);
    existing.push({
      name: stop?.name ?? row.stop_id,
      latitude: stop?.latitude ?? null,
      longitude: stop?.longitude ?? null,
      sequence: Number(row.stop_sequence),
      time: row.departure_time || row.arrival_time,
    });
    allStopTimes.set(row.trip_id, existing);
  });

  const byTrip = new Map([...tripStops].map(([tripId, regionalStops]) => {
    const fullStops = (allStopTimes.get(tripId) ?? []).sort((left, right) => left.sequence - right.sequence);
    const route = fullStops.length ? fullStops : regionalStops.sort((left, right) => left.sequence - right.sequence);
    return [tripId, {
      origin: route[0]?.name ?? '',
      destination: route.at(-1)?.name ?? '',
      departure: route[0]?.time ?? '',
      routeStops: route.map((stop) => ({
        name: stop.name,
        time: stop.time,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
      extremaduraStops: regionalStops.sort((left, right) => left.sequence - right.sequence).map((stop) => stop.name),
    }];
  }));
  const byTrain = new Map();
  byTrip.forEach((route, tripId) => {
    const trainNumber = tripId.slice(0, 5);
    if (!byTrain.has(trainNumber)) byTrain.set(trainNumber, route);
  });

  return { byTrip, byTrain };
}

function toRecord(row, route, targetDate) {
  const observation = toObservation(row);

  return {
    tripId: row.trip_id,
    trainNumber: row.tren,
    date: targetDate,
    status: 'SCHEDULED',
    maxDelayMinutes: observation[1],
    lastDelayMinutes: observation[1],
    observedAt: observation[0],
    samples: 1,
    observations: [observation],
    ...route,
  };
}

function toObservation(row) {
  return [row.timestamp_utc, row.retraso_min === '' ? null : Number(row.retraso_min)];
}

function aggregateRecords(rows, scheduleIndex, targetDate) {
  const records = new Map();

  rows.forEach((row) => {
    if (row.fecha_tren !== targetDate) return;
    if (row.estado === 'CANCELED') return;
    // El GTFS de Renfe solo conserva el periodo horario vigente. Para días ya
    // cerrados, el identificador cambia por la fecha, pero el número comercial
    // permite recuperar el mismo recorrido del horario actual.
    const route = scheduleIndex.byTrip.get(row.trip_id) ?? scheduleIndex.byTrain.get(row.tren);
    if (!route) return;
    const existing = records.get(row.tren);
    const current = existing ?? toRecord(row, route, targetDate);
    const observation = toObservation(row);
    const delay = observation[1];
    if (existing) {
      current.samples += 1;
      current.observations.push(observation);
    }
    current.status = 'SCHEDULED';
    current.tripId = row.trip_id;
    if (delay !== null) current.lastDelayMinutes = delay;
    current.observedAt = observation[0];
    if (delay !== null) current.maxDelayMinutes = Math.max(current.maxDelayMinutes ?? 0, delay);
    records.set(row.tren, current);
  });

  return [...records.values()].map((record) => {
    record.observations.sort((left, right) => left[0].localeCompare(right[0]));
    return record;
  }).sort((left, right) => left.observedAt.localeCompare(right.observedAt) || left.trainNumber.localeCompare(right.trainNumber));
}

async function main() {
  const targetDates = await getTargetDates();
  const workDir = await mkdtemp(join(tmpdir(), 'extretren-'));
  const zipPath = join(workDir, 'google_transit.zip');

  try {
    await download(GTFS_URL, zipPath);
    const [scheduleIndex, outputText] = await Promise.all([getScheduleIndex(zipPath), readFile(OUTPUT_PATH, 'utf8')]);
    const dataset = JSON.parse(outputText);
    const updates = (await mapWithConcurrency(targetDates, 6, async (targetDate) => {
      const rawUrl = getRawUrl(targetDate);
      const response = await fetch(rawUrl, { headers: { 'user-agent': 'ExtreTren data updater' } });
      if (!response.ok) {
        console.warn(`${targetDate}: no se pudo descargar (${response.status}).`);
        return null;
      }
      const records = aggregateRecords(parseCsv(await response.text()), scheduleIndex, targetDate);
      return { date: targetDate, sourceUrl: rawUrl, records };
    })).filter(Boolean);

    if (!updates.length) throw new Error('No se ha podido importar ninguna fecha.');
    const updatedDates = new Set(updates.map((day) => day.date));
    dataset.days = [...dataset.days.filter((day) => !updatedDates.has(day.date)), ...updates]
      .sort((left, right) => left.date.localeCompare(right.date));
    dataset.updatedAt = new Date().toISOString();
    await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
    console.log(`Actualizadas ${updates.length} de ${targetDates.length} fechas (${updates.reduce((total, day) => total + day.records.length, 0)} servicios).`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
