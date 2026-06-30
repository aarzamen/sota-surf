# SOTA Surf

SOTA Surf is a free/open-data surf nowcast dashboard for Ventura, Santa Barbara, and Malibu breaks. It presents local breaking-size estimates, buoy observations, tide state, wind, air temperature, rain, and official surf-zone hazards in a fast tactical-style interface.

The app is designed to keep operational safety labels honest:

- The main swell number is a local breaking estimate.
- The raw buoy peak is shown separately with station and timestamp.
- Tide is interpolated against NOAA prediction points instead of snapping to the last or next tide event.
- NWS Surf Zone Forecast rip-current risk is shown as a hard advisory overlay, and elevated official risk can override the local tactical assessment.

## Data Sources

Core nowcast data uses public government and research feeds:

- CDIP ERDDAP buoy observations for significant wave height, peak period, peak direction, and water temperature context.
- NOAA CO-OPS tide predictions for the nearest configured tide station.
- NWS gridpoint hourly forecast data for wind, air temperature, and precipitation.
- NWS Surf Zone Forecast products for rip-current risk, surf height, water-temperature ranges, thunderstorm potential, and remarks.

Gemini is optional. If `GEMINI_API_KEY` is not configured, the app falls back to deterministic local surf analysis. The open-data nowcast and NWS hazard overlay do not require a Gemini key.

## Current Spot Coverage

Configured breaks include:

- Ventura: C-Street, Emma Wood, Mondos
- Oxnard: Silver Strand
- Santa Barbara / Carpinteria: Rincon, Sandspit, Leadbetter, Tar Pits
- Malibu: County Line, Leo Carrillo, Zuma, Malibu Surfrider

Each spot maps to configured CDIP buoy preferences, a NOAA tide station, a local swell/wind profile, and the relevant NWS Surf Zone Forecast section.

## Run Locally

Prerequisites:

- Node.js 22+
- npm

Install dependencies:

```bash
cd /Users/ama/sota-surf
npm install
```

Start the development server:

```bash
cd /Users/ama/sota-surf
npm run dev -- --host 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000/
```

Optional Gemini features:

```bash
cd /Users/ama/sota-surf
printf 'GEMINI_API_KEY=your_key_here\n' > .env.local
```

## Verify

Run the test suite:

```bash
cd /Users/ama/sota-surf
npm test
```

Build the production bundle:

```bash
cd /Users/ama/sota-surf
npm run build
```

The focused tests cover:

- Open-data source metadata for configured surf spots.
- NOAA tide interpolation at exact nowcast timestamps.
- Avoiding tide-event height snapping near high tide.
- NWS Surf Zone Forecast parsing.
- High rip-current-risk override of the local tactical assessment.

## Implementation Notes

- `services/openDataService.ts` normalizes CDIP, NOAA, and NWS point forecast data into the app's hourly dashboard shape.
- `services/surfZoneService.ts` fetches and parses NWS Surf Zone Forecast products.
- `data/surfSpots.ts` owns spot-specific buoy, tide station, wind, swell, and NWS forecast-area configuration.
- `tests/` contains Node `tsx --test` coverage for source mapping, tide interpolation, weather indexing, local analysis fallback, and advisory parsing.

## Safety Note

This is a situational-awareness tool, not an authority for water entry. Always visually confirm local conditions, heed posted lifeguard and NWS warnings, and treat high rip-current-risk advisories as operationally serious even when local surf estimates look manageable.
