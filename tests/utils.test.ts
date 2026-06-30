import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findClosestWeatherDataIndex } from '../utils.ts';

describe('weather data indexing', () => {
  it('selects the closest timestamp instead of using local clock hour', () => {
    const index = findClosestWeatherDataIndex(
      [
        '2026-06-30T02:00:00.000Z',
        '2026-06-30T03:00:00.000Z',
        '2026-06-30T04:00:00.000Z',
      ],
      new Date('2026-06-30T02:54:00.000Z'),
    );

    assert.equal(index, 1);
  });
});
