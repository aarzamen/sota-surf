import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { generateSurfAnalysis } from '../services/geminiService.ts';

const originalApiKey = process.env.API_KEY;

after(() => {
  if (originalApiKey) {
    process.env.API_KEY = originalApiKey;
  } else {
    delete process.env.API_KEY;
  }
});

describe('local surf analysis fallback', () => {
  it('returns a deterministic analysis when no Gemini key is configured', async () => {
    delete process.env.API_KEY;

    const analysis = await generateSurfAnalysis({
      waveHeight: 0.9,
      wavePeriod: 14,
      waveDirection: 220,
      windSpeed: 3,
      windDirection: 35,
      currentTide: 1.1,
      tidePhase: 'rising',
    });

    assert.equal(typeof analysis.surfScore, 'number');
    assert.ok(analysis.surfScore >= 0);
    assert.ok(analysis.surfScore <= 10);
    assert.match(analysis.description, /Open-data local assessment/);
    assert.equal(analysis.safety.level, 'GREEN');
  });
});
