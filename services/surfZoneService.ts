import { AIAnalysis, RipCurrentRisk, SurfSpot, SurfZoneAdvisory, ThreatLevel } from '../types';

const NWS_PRODUCTS_URL = 'https://api.weather.gov/products';
const RISK_DETAILS: Record<RipCurrentRisk, string> = {
  Low: 'Life threatening rip currents are unlikely but still could occur.',
  Moderate: 'Life threatening rip currents are possible.',
  High: 'Life threatening rip currents are likely.',
};

export async function fetchSurfZoneAdvisory(spot: SurfSpot): Promise<SurfZoneAdvisory | null> {
  if (!spot.nwsOffice || spot.surfZoneAreas.length === 0) return null;

  const listResponse = await fetch(`${NWS_PRODUCTS_URL}/types/SRF/locations/${spot.nwsOffice}`);
  if (!listResponse.ok) {
    throw new Error(`NWS surf forecast list HTTP ${listResponse.status}`);
  }

  const listData = await listResponse.json();
  const latest = listData?.['@graph']?.[0] as { id?: string; issuanceTime?: string } | undefined;
  if (!latest?.id) return null;

  const productResponse = await fetch(`${NWS_PRODUCTS_URL}/${latest.id}`);
  if (!productResponse.ok) {
    throw new Error(`NWS surf forecast HTTP ${productResponse.status}`);
  }

  const productData = await productResponse.json();
  return parseSurfZoneAdvisory(productData?.productText ?? '', spot.surfZoneAreas, latest.issuanceTime ?? '');
}

export function parseSurfZoneAdvisory(
  productText: string,
  targetAreas: string[],
  issuedAt: string,
): SurfZoneAdvisory | null {
  const section = findAreaSection(productText, targetAreas);
  if (!section) return null;

  const riskLevel = parseRisk(section);
  if (!riskLevel) return null;

  const areas = targetAreas.filter((area) => section.includes(`${area}-`) || section.includes(area));

  return {
    riskLevel,
    threatLevel: threatForRisk(riskLevel),
    headline: `${riskLevel.toUpperCase()} RIP CURRENT RISK`,
    details: RISK_DETAILS[riskLevel],
    source: 'NWS Surf Zone Forecast',
    issuedAt,
    areas,
    surfHeight: parseField(section, 'Surf Height'),
    waterTemperature: parseField(section, 'Water Temperature'),
    thunderstormPotential: parseField(section, 'Thunderstorm Potential'),
    remarks: parseField(section, 'Remarks'),
  };
}

export function applyHazardOverrideToAnalysis(
  analysis: AIAnalysis,
  advisory: SurfZoneAdvisory | null | undefined,
): AIAnalysis {
  if (!advisory || advisory.riskLevel === 'Low') return analysis;

  const prefix = `NWS ${advisory.headline}: ${advisory.details}`;
  const level = advisory.threatLevel;

  return {
    ...analysis,
    safety: {
      level,
      details: `${prefix} Local estimate: ${analysis.safety.details}`,
    },
    skillLevel: advisory.riskLevel === 'High' ? 'Advanced' : analysis.skillLevel,
    timing: `${advisory.source} active; ${analysis.timing}`,
  };
}

function findAreaSection(productText: string, targetAreas: string[]): string | null {
  const sections = productText.split(/\n\$\$\s*\n?/);
  return sections.find((section) => targetAreas.some((area) => section.includes(`${area}-`) || section.includes(area))) ?? null;
}

function parseRisk(section: string): RipCurrentRisk | null {
  const fieldRisk = section.match(/Rip Current Risk\*?\.*\s*(Low|Moderate|High)\./i)?.[1];
  const headlineRisk = section.match(/\.\.\.(LOW|MODERATE|HIGH) RIP CURRENT RISK\.\.\./i)?.[1];
  const risk = fieldRisk ?? headlineRisk;
  if (!risk) return null;

  const normalized = risk.toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'moderate') return 'Moderate';
  if (normalized === 'high') return 'High';
  return null;
}

function threatForRisk(risk: RipCurrentRisk): ThreatLevel {
  if (risk === 'High') return 'RED';
  if (risk === 'Moderate') return 'YELLOW';
  return 'GREEN';
}

function parseField(section: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = section.match(new RegExp(`${escaped}\\.*\\s*([^\\n]+)`, 'i'));
  return match?.[1]?.trim().replace(/\.$/, '');
}
