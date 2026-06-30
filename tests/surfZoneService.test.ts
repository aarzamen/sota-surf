import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyHazardOverrideToAnalysis, parseSurfZoneAdvisory } from '../services/surfZoneService.ts';
import { AIAnalysis } from '../types.ts';

const productText = `Surf Zone Forecast
National Weather Service Los Angeles/Oxnard
135 PM PDT Mon Jun 29 2026

CAZ362-364-301115-
Malibu Coast-
Los Angeles County Beaches-
135 PM PDT Mon Jun 29 2026

...HIGH RIP CURRENT RISK...

.THIS AFTERNOON THROUGH TUESDAY...
Rip Current Risk*.............High.
Surf Height...................3 to 5 feet.
Thunderstorm Potential........None expected.
Water Temperature.............62 to 69 degrees.
Remarks.......................Mixed west swell and south swell.

&&

Rip Current Risks:
* High Risk - Life threatening rip currents are likely.
`;

describe('surf zone advisory parsing', () => {
  it('parses NWS high rip current risk for Malibu sections', () => {
    const advisory = parseSurfZoneAdvisory(productText, ['Malibu Coast', 'Los Angeles County Beaches'], '2026-06-29T20:35:00.000Z');

    assert.equal(advisory?.riskLevel, 'High');
    assert.equal(advisory?.threatLevel, 'RED');
    assert.equal(advisory?.surfHeight, '3 to 5 feet');
    assert.equal(advisory?.remarks, 'Mixed west swell and south swell');
    assert.match(advisory?.details ?? '', /Life threatening rip currents are likely/i);
  });

  it('upgrades a green local analysis when official NWS risk is high', () => {
    const baseAnalysis: AIAnalysis = {
      surfScore: 6.8,
      safety: {
        level: 'GREEN',
        details: 'Manageable open-data hazard profile.',
      },
      skillLevel: 'Novice',
      timing: 'Near high tide',
      description: 'Open-data local assessment.',
    };
    const advisory = parseSurfZoneAdvisory(productText, ['Malibu Coast'], '2026-06-29T20:35:00.000Z');

    const analysis = applyHazardOverrideToAnalysis(baseAnalysis, advisory);

    assert.equal(analysis.safety.level, 'RED');
    assert.match(analysis.safety.details, /NWS HIGH RIP CURRENT RISK/i);
    assert.equal(analysis.skillLevel, 'Advanced');
  });
});
