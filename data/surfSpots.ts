import { SurfSpot } from '../types';

export const SURF_SPOTS: { [key: string]: SurfSpot } = {
  cstreet: { 
    id: 'cstreet',
    lat: 34.2742, 
    lon: -119.3031, 
    name: "C-Street (Ventura Point)", 
    region: 'Ventura',
    minTide: 0.8, 
    offshoreDirection: { from: 30, to: 120 }, // NE to E
    timezone: 'America/Los_Angeles'
  },
  rincon: {
    id: 'rincon',
    lat: 34.3734,
    lon: -119.4761,
    name: "Rincon Point",
    region: 'Carpinteria',
    minTide: 1.0, 
    offshoreDirection: { from: 340, to: 45 }, // N to NE
    timezone: 'America/Los_Angeles'
  },
  silverstrand: { 
    id: 'silverstrand',
    lat: 34.1553, 
    lon: -119.2192, 
    name: "Silver Strand", 
    region: 'Oxnard',
    minTide: 0.5, 
    offshoreDirection: { from: 45, to: 135 }, // NE to E
    timezone: 'America/Los_Angeles'
  },
  emmawood: { 
    id: 'emmawood',
    lat: 34.2818, 
    lon: -119.3172, 
    name: "Emma Wood", 
    region: 'Ventura',
    minTide: 1.2, 
    offshoreDirection: { from: 30, to: 110 }, // NE to E
    timezone: 'America/Los_Angeles'
  },
  mondos: {
    id: 'mondos',
    lat: 34.3164,
    lon: -119.3822,
    name: "Mondos Beach",
    region: 'Ventura',
    minTide: 0.2,
    offshoreDirection: { from: 30, to: 110 }, // NE to E
    timezone: 'America/Los_Angeles'
  },
  countyline: {
    id: 'countyline',
    lat: 34.0504,
    lon: -118.9632,
    name: "County Line",
    region: 'Malibu Coast',
    minTide: 0.5,
    offshoreDirection: { from: 330, to: 45 }, // N to NE
    timezone: 'America/Los_Angeles'
  },
  leocarrillo: {
    id: 'leocarrillo',
    lat: 34.0451,
    lon: -118.9372,
    name: "Leo Carrillo",
    region: 'Malibu Coast',
    minTide: 1.0,
    offshoreDirection: { from: 330, to: 45 }, // N to NE
    timezone: 'America/Los_Angeles'
  },
  zuma: {
    id: 'zuma',
    lat: 34.0223,
    lon: -118.8234,
    name: "Zuma Beach",
    region: 'Malibu',
    minTide: 0.4,
    offshoreDirection: { from: 330, to: 45 }, // N to NE
    timezone: 'America/Los_Angeles'
  },
  surfrider: {
    id: 'surfrider',
    lat: 34.0362,
    lon: -118.6791,
    name: "Malibu Surfrider",
    region: 'Malibu',
    minTide: 0.8,
    offshoreDirection: { from: 320, to: 40 }, // NW to NE
    timezone: 'America/Los_Angeles'
  },
  sandspit: {
    id: 'sandspit',
    lat: 34.4052,
    lon: -119.6881,
    name: "Sandspit",
    region: 'Santa Barbara',
    minTide: 0.5,
    offshoreDirection: { from: 270, to: 360 }, // W to N
    timezone: 'America/Los_Angeles'
  },
  leadbetter: {
    id: 'leadbetter',
    lat: 34.4021,
    lon: -119.6992,
    name: "Leadbetter Beach",
    region: 'Santa Barbara',
    minTide: 0.6,
    offshoreDirection: { from: 315, to: 45 }, // NW to NE
    timezone: 'America/Los_Angeles'
  },
  tarpits: {
    id: 'tarpits',
    lat: 34.3892,
    lon: -119.5113,
    name: "Tar Pits",
    region: 'Carpinteria',
    minTide: 0.8,
    offshoreDirection: { from: 330, to: 45 }, // N to NE
    timezone: 'America/Los_Angeles'
  }
};
