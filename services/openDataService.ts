import { HourlyWeatherData, SpotConditions, SurfSpot, TidePhase, WindRelation } from '../types';
import { directionToDegrees } from '../utils';

type TidePoint = {
  time: string;
  height_m: number;
};

type WeatherPoint = {
  time: string;
  wind_speed_mps: number;
  wind_direction_deg: number;
  air_temp_c: number;
  rain_mm: number;
};

type AdapterOptions = {
  generatedAt?: Date;
  hours?: number;
  tideSeries?: TidePoint[];
  weatherSeries?: WeatherPoint[];
};

type CdipWaveObservation = {
  stationId: string;
  height_m: number;
  period_s: number;
  direction_deg: number;
  observed_at: string;
  confidence: number;
};

const CDIP_ERDDAP_URL = 'https://erddap.cdip.ucsd.edu/erddap/tabledap/wave_agg.json';
const NOAA_COOPS_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NWS_POINTS_URL = 'https://api.weather.gov/points';

const CDIP_STATION_NAMES: Record<string, string> = {
  '028': 'Santa Monica Bay',
  '045': 'Oceanside Offshore',
  '067': 'San Nicolas Island',
  '071': 'Harvest',
  '092': 'San Pedro',
  '100': 'Torrey Pines Outer',
  '103': 'Topanga Nearshore',
  '153': 'Del Mar Nearshore',
  '191': 'Point Loma South',
  '201': 'Scripps Nearshore',
  '213': 'San Pedro South',
  '215': 'Long Beach Channel',
  '220': 'Mission Bay West',
  '262': 'Leucadia Nearshore',
  '284': 'Capistrano Beach Nearshore',
};

const MS_PER_HOUR = 60 * 60 * 1000;

export function adaptSpotConditionsToHourlyWeatherData(
  spotConditions: SpotConditions,
  options: AdapterOptions = {},
): HourlyWeatherData {
  const hours = options.hours ?? 48;
  const start = floorToHour(options.generatedAt ?? new Date(spotConditions.generated_at));
  const time = Array.from({ length: hours }, (_, index) => new Date(start.getTime() + index * MS_PER_HOUR).toISOString());
  const tideByHour = new Map((options.tideSeries ?? []).map((point) => [floorIsoHour(point.time), point.height_m]));
  const weatherByHour = new Map((options.weatherSeries ?? []).map((point) => [floorIsoHour(point.time), point]));
  const { conditions } = spotConditions;

  return {
    time,
    tide: time.map((iso) => tideByHour.get(iso) ?? conditions.tide.height_m),
    wind_speed_10m: time.map((iso) => weatherByHour.get(iso)?.wind_speed_mps ?? conditions.wind.speed_mps),
    wind_direction_10m: time.map((iso) => weatherByHour.get(iso)?.wind_direction_deg ?? conditions.wind.direction_deg),
    wave_height: time.map(() => conditions.primary_swell.height_m),
    wave_direction: time.map(() => conditions.primary_swell.direction_deg),
    wave_period: time.map(() => conditions.primary_swell.period_s),
    swell_wave_height: time.map(() => conditions.surf_estimate.breaking_size_m),
    swell_wave_direction: time.map(() => conditions.primary_swell.direction_deg),
    swell_wave_period: time.map(() => conditions.primary_swell.period_s),
    temperature_2m: time.map((iso) => weatherByHour.get(iso)?.air_temp_c ?? conditions.weather.air_temp_c),
    precipitation: time.map((iso) => weatherByHour.get(iso)?.rain_mm ?? conditions.weather.rain_mm),
  };
}

export const fetchWeatherData = async (spot: SurfSpot): Promise<{ hourly: HourlyWeatherData }> => {
  const generatedAt = new Date();
  const [wave, tideSeries, weatherSeries] = await Promise.all([
    fetchBestCdipWaveObservation(spot),
    fetchNoaaTidePredictions(spot, generatedAt).catch(() => [] as TidePoint[]),
    fetchNwsHourlyForecast(spot).catch(() => [] as WeatherPoint[]),
  ]);

  const tideNow = nearestTidePoint(tideSeries, generatedAt);
  const weatherNow = nearestWeatherPoint(weatherSeries, generatedAt);
  const breakingSize = estimatedBreakingSizeM(
    wave.height_m,
    wave.period_s,
    wave.direction_deg,
    spot.bestSwellFromDeg,
    spot.spotMultiplier,
  );
  const windRelationValue = windRelation(weatherNow.wind_direction_deg, spot.offshoreWindFromDeg);

  const conditions: SpotConditions = {
    spot_id: spot.id,
    generated_at: generatedAt.toISOString(),
    conditions: {
      primary_swell: {
        height_m: wave.height_m,
        period_s: wave.period_s,
        direction_deg: wave.direction_deg,
        source: `CDIP ${wave.stationId} ${CDIP_STATION_NAMES[wave.stationId] ?? 'Station'}`,
        observed_at: wave.observed_at,
        confidence: wave.confidence,
      },
      tide: {
        height_m: tideNow.height_m,
        state: tideState(tideSeries, generatedAt),
        station: `${spot.tideStation} ${spot.tideStationName}`,
        datum: 'MLLW',
      },
      wind: {
        speed_mps: weatherNow.wind_speed_mps,
        direction_deg: weatherNow.wind_direction_deg,
        relation: windRelationValue,
        source: weatherSeries.length > 0 ? 'NWS grid' : 'NWS grid unavailable',
      },
      weather: {
        air_temp_c: weatherNow.air_temp_c,
        rain_mm: weatherNow.rain_mm,
      },
      surf_estimate: {
        breaking_size_m: breakingSize,
        quality_score: qualityScore(breakingSize, windRelationValue, wave.confidence),
        notes: surfNotes(wave, breakingSize, windRelationValue),
      },
    },
  };

  return {
    hourly: adaptSpotConditionsToHourlyWeatherData(conditions, {
      generatedAt,
      hours: 48,
      tideSeries,
      weatherSeries,
    }),
  };
};

async function fetchBestCdipWaveObservation(spot: SurfSpot): Promise<CdipWaveObservation> {
  const failures: string[] = [];

  for (const stationId of spot.waveBuoys) {
    try {
      return await fetchCdipWaveObservation(stationId);
    } catch (error) {
      failures.push(`${stationId}: ${(error as Error).message}`);
    }
  }

  throw new Error(`CDIP wave data unavailable for ${spot.name}. ${failures.join(' | ')}`);
}

async function fetchCdipWaveObservation(stationId: string): Promise<CdipWaveObservation> {
  const since = new Date(Date.now() - 36 * MS_PER_HOUR).toISOString();
  const query = [
    'station_id,time,waveHs,waveTp,waveTa,waveDp,latitude,longitude',
    `station_id=%22${stationId}%22`,
    `time>=${since}`,
    'waveFlagPrimary=1',
    'orderByMax(%22time%22)',
  ].join('&');
  const response = await fetch(`${CDIP_ERDDAP_URL}?${query}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const columns = data?.table?.columnNames as string[] | undefined;
  const rows = data?.table?.rows as unknown[][] | undefined;

  if (!columns || !rows || rows.length === 0) {
    throw new Error('empty response');
  }

  const row = rows[rows.length - 1];
  const value = (name: string) => row[columns.indexOf(name)];
  const height = asNumber(value('waveHs'));
  const period = asNumber(value('waveTp') ?? value('waveTa'));
  const direction = asNumber(value('waveDp'));
  const observedAt = String(value('time'));

  if (height <= 0 || period <= 0) {
    throw new Error('missing wave height or period');
  }

  return {
    stationId,
    height_m: height,
    period_s: period,
    direction_deg: normalizeDegrees(direction),
    observed_at: observedAt,
    confidence: freshnessConfidence(observedAt),
  };
}

async function fetchNoaaTidePredictions(spot: SurfSpot, start: Date): Promise<TidePoint[]> {
  const params = new URLSearchParams({
    station: spot.tideStation,
    product: 'predictions',
    begin_date: formatNoaaDate(start),
    range: '48',
    datum: 'MLLW',
    units: 'metric',
    time_zone: 'gmt',
    interval: 'h',
    format: 'json',
    application: 'SOTA-Surf',
  });
  const response = await fetch(`${NOAA_COOPS_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`NOAA tide HTTP ${response.status}`);
  }

  const data = await response.json();
  const predictions = data?.predictions as { t: string; v: string }[] | undefined;

  if (!predictions || predictions.length === 0) {
    throw new Error('NOAA tide response empty');
  }

  return predictions.map((prediction) => ({
    time: parseNoaaGmtTime(prediction.t).toISOString(),
    height_m: asNumber(prediction.v),
  }));
}

async function fetchNwsHourlyForecast(spot: SurfSpot): Promise<WeatherPoint[]> {
  const pointResponse = await fetch(`${NWS_POINTS_URL}/${spot.lat.toFixed(4)},${spot.lon.toFixed(4)}`);

  if (!pointResponse.ok) {
    throw new Error(`NWS point HTTP ${pointResponse.status}`);
  }

  const pointData = await pointResponse.json();
  const hourlyUrl = pointData?.properties?.forecastHourly as string | undefined;

  if (!hourlyUrl) {
    throw new Error('NWS hourly URL missing');
  }

  const forecastResponse = await fetch(hourlyUrl);

  if (!forecastResponse.ok) {
    throw new Error(`NWS hourly HTTP ${forecastResponse.status}`);
  }

  const forecastData = await forecastResponse.json();
  const periods = forecastData?.properties?.periods as any[] | undefined;

  if (!periods || periods.length === 0) {
    throw new Error('NWS hourly response empty');
  }

  return periods.slice(0, 48).map((period) => ({
    time: new Date(period.startTime).toISOString(),
    wind_speed_mps: mphToMps(parseWindMph(period.windSpeed ?? '0 mph')),
    wind_direction_deg: directionToDegrees(period.windDirection ?? ''),
    air_temp_c: temperatureToCelsius(asNumber(period.temperature), period.temperatureUnit),
    rain_mm: probabilityToRainTrace(period.probabilityOfPrecipitation?.value),
  }));
}

export function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

export function directionalExposure(waveFromDeg: number, idealFromDeg: number, cutoffDeg = 90): number {
  const diff = angleDiff(waveFromDeg, idealFromDeg);
  if (diff >= cutoffDeg) return 0;
  return Math.max(0, Math.cos((diff * Math.PI) / 180));
}

export function estimatedBreakingSizeM(
  buoyHeightM: number,
  periodS: number,
  waveFromDeg: number,
  idealFromDeg: number,
  spotMultiplier = 1,
): number {
  const exposure = directionalExposure(waveFromDeg, idealFromDeg);
  const periodBoost = Math.min(1.8, Math.max(0.7, periodS / 10));
  return round1(buoyHeightM * exposure * periodBoost * spotMultiplier);
}

export function windRelation(windFromDeg: number, offshoreFromDeg: number): WindRelation {
  const diff = angleDiff(windFromDeg, offshoreFromDeg);
  if (diff <= 35) return 'offshore';
  if (diff <= 75) return 'cross-offshore';
  if (diff <= 115) return 'cross-shore';
  if (diff <= 145) return 'cross-onshore';
  return 'onshore';
}

function surfNotes(wave: CdipWaveObservation, breakingSizeM: number, relation: WindRelation): string[] {
  const notes: string[] = [];

  if (wave.period_s >= 13) notes.push('long-period energy present');
  if (breakingSizeM < 0.3) notes.push('limited spot exposure to current swell vector');
  if (relation !== 'offshore' && relation !== 'cross-offshore') notes.push(`wind is ${relation}`);
  if (wave.confidence < 0.6) notes.push('wave observation is aging');

  return notes.length > 0 ? notes : ['open-data nowcast nominal'];
}

function qualityScore(breakingSizeM: number, relation: WindRelation, confidence: number): number {
  const sizeScore = Math.min(45, breakingSizeM * 28);
  const windScore: Record<WindRelation, number> = {
    offshore: 35,
    'cross-offshore': 28,
    'cross-shore': 18,
    'cross-onshore': 8,
    onshore: 2,
  };

  return Math.round(Math.max(0, Math.min(100, sizeScore + windScore[relation] + confidence * 20)));
}

function tideState(series: TidePoint[], now: Date): TidePhase {
  const previous = [...series].reverse().find((point) => new Date(point.time).getTime() <= now.getTime());
  const next = series.find((point) => new Date(point.time).getTime() > now.getTime());

  if (!previous || !next) return 'rising';

  const diff = next.height_m - previous.height_m;
  if (Math.abs(diff) < 0.05) return previous.height_m > 1.8 ? 'peak high' : 'peak low';
  return diff > 0 ? 'rising' : 'falling';
}

function nearestTidePoint(series: TidePoint[], now: Date): TidePoint {
  if (series.length === 0) return { time: now.toISOString(), height_m: 0 };
  return nearestByTime(series, now);
}

function nearestWeatherPoint(series: WeatherPoint[], now: Date): WeatherPoint {
  if (series.length === 0) {
    return {
      time: now.toISOString(),
      wind_speed_mps: 0,
      wind_direction_deg: 0,
      air_temp_c: 0,
      rain_mm: 0,
    };
  }

  return nearestByTime(series, now);
}

function nearestByTime<T extends { time: string }>(series: T[], now: Date): T {
  return series.reduce((best, point) => {
    const bestDiff = Math.abs(new Date(best.time).getTime() - now.getTime());
    const pointDiff = Math.abs(new Date(point.time).getTime() - now.getTime());
    return pointDiff < bestDiff ? point : best;
  }, series[0]);
}

function floorToHour(date: Date): Date {
  const next = new Date(date);
  next.setUTCMinutes(0, 0, 0);
  return next;
}

function floorIsoHour(iso: string): string {
  return floorToHour(new Date(iso)).toISOString();
}

function formatNoaaDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseNoaaGmtTime(value: string): Date {
  const [date, time] = value.split(' ');
  return new Date(`${date}T${time}:00Z`);
}

function parseWindMph(value: string): number {
  const matches = value.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return 0;
  const speeds = matches.map(Number);
  return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
}

function probabilityToRainTrace(value: number | null | undefined): number {
  if (typeof value !== 'number') return 0;
  if (value <= 15) return 0;
  if (value <= 40) return 0.2;
  if (value <= 70) return 0.8;
  return 1.5;
}

function temperatureToCelsius(value: number, unit?: string): number {
  if (unit === 'F') return (value - 32) * (5 / 9);
  return value;
}

function freshnessConfidence(iso: string): number {
  const ageHours = Math.max(0, (Date.now() - new Date(iso).getTime()) / MS_PER_HOUR);
  return round2(Math.max(0.2, Math.min(1, 1 - ageHours / 12)));
}

function mphToMps(mph: number): number {
  return mph * 0.44704;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
