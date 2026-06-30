
export interface SurfSpot {
  id: string;
  lat: number;
  lon: number;
  name: string;
  region: string;
  minTide: number;
  offshoreDirection: { from: number, to: number };
  timezone: string;
  waveBuoys: string[];
  tideStation: string;
  tideStationName: string;
  swellWindowDeg: [number, number];
  bestSwellFromDeg: number;
  offshoreWindFromDeg: number;
  spotMultiplier: number;
  nwsOffice: string;
  surfZoneAreas: string[];
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
    tide_phase?: TidePhase[];
    sourceInfo?: ConditionsSourceInfo;
    hazardAdvisory?: SurfZoneAdvisory | null;
}

export type TidePhase = 'rising' | 'falling' | 'near high' | 'near low' | 'peak high' | 'peak low';

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

export type ThreatLevel = 'GREEN' | 'YELLOW' | 'RED';
export type RipCurrentRisk = 'Low' | 'Moderate' | 'High';

export interface SurfZoneAdvisory {
  riskLevel: RipCurrentRisk;
  threatLevel: ThreatLevel;
  headline: string;
  details: string;
  source: string;
  issuedAt: string;
  areas: string[];
  surfHeight?: string;
  waterTemperature?: string;
  thunderstormPotential?: string;
  remarks?: string;
}

export interface ConditionsSourceInfo {
  primarySwell: {
    summary: string;
    source: string;
    observedAt: string;
    height_m: number;
    period_s: number;
    direction_deg: number;
  };
  tide: {
    summary: string;
    source: string;
    datum: string;
  };
  wind: {
    summary: string;
    source: string;
  };
  airTemp: {
    summary: string;
    source: string;
  };
  rain: {
    summary: string;
    source: string;
  };
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

export type WindRelation =
  | 'offshore'
  | 'cross-offshore'
  | 'cross-shore'
  | 'cross-onshore'
  | 'onshore';

export interface SpotConditions {
  spot_id: string;
  generated_at: string;
  conditions: {
    primary_swell: {
      height_m: number;
      period_s: number;
      direction_deg: number;
      source: string;
      observed_at: string;
      confidence: number;
    };
    tide: {
      height_m: number;
      state: TidePhase;
      station: string;
      datum: string;
    };
    wind: {
      speed_mps: number;
      direction_deg: number;
      relation: WindRelation;
      source: string;
    };
    weather: {
      air_temp_c: number;
      rain_mm: number;
    };
    surf_estimate: {
      breaking_size_m: number;
      quality_score: number;
      notes: string[];
    };
    hazard_advisory?: SurfZoneAdvisory | null;
  };
}
