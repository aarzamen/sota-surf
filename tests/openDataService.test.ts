import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SURF_SPOTS } from '../data/surfSpots.ts';
import { adaptSpotConditionsToHourlyWeatherData } from '../services/openDataService.ts';
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
    });

    assert.equal(hourly.time.length, 48);
    assert.equal(hourly.tide.length, 48);
    assert.equal(hourly.wave_height[0], 0.92);
    assert.equal(hourly.wave_period[0], 14.3);
    assert.equal(hourly.wave_direction[0], 198);
    assert.equal(hourly.swell_wave_height[0], 0.7);
    assert.equal(hourly.wind_speed_10m[0], 3.1);
    assert.equal(hourly.wind_direction_10m[0], 265);
    assert.equal(hourly.temperature_2m[0], 17);
    assert.equal(hourly.precipitation[0], 0);
    assert.equal(hourly.time[0], '2026-06-30T02:00:00.000Z');
    assert.equal(hourly.time[47], '2026-07-02T01:00:00.000Z');
  });
});
