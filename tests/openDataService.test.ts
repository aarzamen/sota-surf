import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SURF_SPOTS } from '../data/surfSpots.ts';
import { adaptSpotConditionsToHourlyWeatherData, interpolateTideHeight } from '../services/openDataService.ts';
import { SpotConditions } from '../types.ts';

describe('open-data surf feed', () => {
  it('declares official source metadata for Ventura and Malibu spots', () => {
    assert.deepEqual(SURF_SPOTS.cstreet.waveBuoys, ['071', '028', '103']);
    assert.equal(SURF_SPOTS.cstreet.tideStation, '9411189');
    assert.equal(SURF_SPOTS.cstreet.bestSwellFromDeg, 285);
    assert.deepEqual(SURF_SPOTS.zuma.waveBuoys, ['028', '103', '067']);
    assert.equal(SURF_SPOTS.zuma.tideStation, '9410840');
    assert.equal(SURF_SPOTS.zuma.offshoreWindFromDeg, 35);
  });

  it('adapts one normalized nowcast into the dashboard hourly arrays', () => {
    const conditions: SpotConditions = {
      spot_id: 'zuma',
      generated_at: '2026-06-30T02:15:00.000Z',
      conditions: {
        primary_swell: {
          height_m: 0.92,
          period_s: 14.3,
          direction_deg: 198,
          source: 'CDIP 028 Santa Monica Bay',
          observed_at: '2026-06-30T01:30:00.000Z',
          confidence: 0.87,
        },
        tide: {
          height_m: 1.23,
          state: 'rising',
          station: '9410840 Santa Monica',
          datum: 'MLLW',
        },
        wind: {
          speed_mps: 3.1,
          direction_deg: 265,
          relation: 'cross-shore',
          source: 'NWS grid',
        },
        weather: {
          air_temp_c: 17,
          rain_mm: 0,
        },
        surf_estimate: {
          breaking_size_m: 0.7,
          quality_score: 62,
          notes: ['long-period SSW energy present', 'wind not ideal'],
        },
      },
    };

    const hourly = adaptSpotConditionsToHourlyWeatherData(conditions, {
      generatedAt: new Date('2026-06-30T02:15:00.000Z'),
      hours: 48,
      weatherSeries: [
        {
          time: '2026-06-30T02:00:00.000Z',
          wind_speed_mps: 4.4,
          wind_direction_deg: 270,
          air_temp_c: 18,
          rain_mm: 0.2,
        },
      ],
    });

    assert.equal(hourly.time.length, 48);
    assert.equal(hourly.tide.length, 48);
    assert.equal(hourly.wave_height[0], 0.92);
    assert.equal(hourly.wave_period[0], 14.3);
    assert.equal(hourly.wave_direction[0], 198);
    assert.equal(hourly.swell_wave_height[0], 0.7);
    assert.equal(hourly.wind_speed_10m[0], 4.4);
    assert.equal(hourly.wind_direction_10m[0], 270);
    assert.equal(hourly.temperature_2m[0], 18);
    assert.equal(hourly.precipitation[0], 0.2);
    assert.equal(hourly.time[0], '2026-06-30T02:15:00.000Z');
    assert.equal(hourly.time[47], '2026-07-02T01:15:00.000Z');
    assert.equal(
      hourly.sourceInfo?.primarySwell.summary,
      'CDIP 028 Santa Monica Bay peak: 0.92 m @ 14.3s, 198°; obs 2026-06-30 01:30Z',
    );
    assert.equal(hourly.sourceInfo?.tide.summary, '9410840 Santa Monica MLLW; interp 2026-06-30 02:15Z');
    assert.equal(hourly.sourceInfo?.wind.summary, 'NWS grid; valid 2026-06-30 02:00Z');
  });

  it('interpolates current tide between NOAA prediction points', () => {
    const tideHeight = interpolateTideHeight(
      [
        { time: '2026-06-30T03:00:00.000Z', height_m: 1.685 },
        { time: '2026-06-30T03:06:00.000Z', height_m: 1.704 },
      ],
      new Date('2026-06-30T03:03:00.000Z'),
    );

    assert.ok(Math.abs(tideHeight - 1.6945) < 0.0001);
  });

  it('uses exact nowcast time for current tide instead of snapping to the next high event', () => {
    const conditions: SpotConditions = {
      spot_id: 'surfrider',
      generated_at: '2026-06-30T03:37:00.000Z',
      conditions: {
        primary_swell: {
          height_m: 1.02,
          period_s: 9.09,
          direction_deg: 274,
          source: 'CDIP 028 Santa Monica Bay',
          observed_at: '2026-06-30T03:26:00.000Z',
          confidence: 0.98,
        },
        tide: {
          height_m: 1.79,
          state: 'near high',
          station: '9410840 Santa Monica',
          datum: 'MLLW',
        },
        wind: {
          speed_mps: 2.2,
          direction_deg: 270,
          relation: 'cross-shore',
          source: 'NWS grid',
        },
        weather: {
          air_temp_c: 16,
          rain_mm: 0,
        },
        surf_estimate: {
          breaking_size_m: 0.5,
          quality_score: 68,
          notes: [],
        },
      },
    };

    const hourly = adaptSpotConditionsToHourlyWeatherData(conditions, {
      generatedAt: new Date('2026-06-30T03:37:00.000Z'),
      hours: 2,
      tideSeries: [
        { time: '2026-06-30T03:36:00.000Z', height_m: 1.79 },
        { time: '2026-06-30T03:42:00.000Z', height_m: 1.805 },
        { time: '2026-06-30T04:25:00.000Z', height_m: 1.82 },
      ],
    });

    assert.equal(hourly.time[0], '2026-06-30T03:37:00.000Z');
    assert.ok(hourly.tide[0] > 1.79);
    assert.ok(hourly.tide[0] < 1.82);
    assert.equal(hourly.tide_phase?.[0], 'near high');
  });
});
