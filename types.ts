
export interface SurfSpot {
  id: string;
  lat: number;
  lon: number;
  name: string;
  region: string;
  minTide: number;
  offshoreDirection: { from: number, to: number };
  timezone: string;
}

export interface HourlyWeatherData {
    time: string[];
    tide: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
    temperature_2m: number[];
    precipitation: number[];
}

export type TidePhase = 'rising' | 'falling' | 'peak high' | 'peak low';

export interface Conditions {
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeed: number;
  windDirection: number;
  currentTide: number;
  tidePhase: TidePhase;
}

export interface AIAnalysis {
  surfScore: number;
  safety: {
    level: string;
    details: string;
  };
  skillLevel: string;
  timing: string;
  description: string;
}

export interface LocalIntelData {
    summary: string;
    sources: { title: string, url: string }[];
}

export interface NearbyPlace {
    title: string;
    uri: string;
    rating: string;
}

export interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  memory: number;
  aiLatency: number | null;
  apiCalls: { count: number; avgTime: number };
  componentRenders: number;
}

// Types for World Weather Online API response
export interface WWO_HourlyData {
    time: string;
    sigHeight_m: string;
    swellDir16Point: string;
    swellPeriod_secs: string;
    swellHeight_m: string;
    windspeedKmph: string;
    winddir16Point: string;
    tempC?: string;
    precipMM?: string;
}

export interface WWO_TideData {
    tideTime: string;
    tideHeight_mt: string;
}

export interface WWO_Tides {
    tide_data: WWO_TideData[];
}

export interface WWO_WeatherDay {
    date: string;
    hourly: WWO_HourlyData[];
    tides: WWO_Tides[];
}

export interface WWO_Response {
    data?: {
        weather?: WWO_WeatherDay[];
        error?: { msg: string }[];
    }
}
