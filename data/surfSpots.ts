
import { SurfSpot } from '../types';

export const SURF_SPOTS: { [key: string]: SurfSpot } = {
  // West Coast / Sunabe Area
  sunabe: { 
    id: 'sunabe',
    lat: 26.318, 
    lon: 127.744, 
    name: "Sunabe Seawall", 
    region: 'Chatan',
    minTide: 1.4, 
    offshoreDirection: { from: 45, to: 135 }, // E/NE
    timezone: 'Asia/Tokyo'
  },
  miyagi: {
    id: 'miyagi',
    lat: 26.325,
    lon: 127.742,
    name: "Miyagi Coast",
    region: 'Chatan',
    minTide: 1.4, 
    offshoreDirection: { from: 45, to: 135 },
    timezone: 'Asia/Tokyo'
  },
  // West Coast / Yomitan
  maeda: { 
    id: 'maeda',
    lat: 26.442, 
    lon: 127.776, 
    name: "Maeda Point", 
    region: 'Onna',
    minTide: 1.5, 
    offshoreDirection: { from: 90, to: 180 }, // SE
    timezone: 'Asia/Tokyo'
  },
  zanpa: { 
    id: 'zanpa',
    lat: 26.439, 
    lon: 127.711, 
    name: "Cape Zanpa", 
    region: 'Yomitan',
    minTide: 1.3, 
    offshoreDirection: { from: 90, to: 180 }, // SE
    timezone: 'Asia/Tokyo'
  },
  toguchi: {
    id: 'toguchi',
    lat: 26.365,
    lon: 127.739,
    name: "Toguchi Beach",
    region: 'Yomitan',
    minTide: 1.6,
    offshoreDirection: { from: 90, to: 160 },
    timezone: 'Asia/Tokyo'
  },
  // East Coast
  ikei: {
    id: 'ikei',
    lat: 26.394,
    lon: 127.993,
    name: "Ikei Island",
    region: 'Uruma',
    minTide: 1.0,
    offshoreDirection: { from: 225, to: 315 }, // W/SW
    timezone: 'Asia/Tokyo'
  },
  whitebeach: {
    id: 'whitebeach',
    lat: 26.295,
    lon: 127.913,
    name: "White Beach",
    region: 'Uruma',
    minTide: 1.2,
    offshoreDirection: { from: 225, to: 315 }, // W
    timezone: 'Asia/Tokyo'
  },
  tsuken: {
    id: 'tsuken',
    lat: 26.243,
    lon: 127.944,
    name: "Tsuken Island",
    region: 'Uruma',
    minTide: 1.0,
    offshoreDirection: { from: 225, to: 315 },
    timezone: 'Asia/Tokyo'
  },
  ukibaru: {
    id: 'ukibaru',
    lat: 26.302,
    lon: 127.970,
    name: "Ukibaru Island",
    region: 'Uruma',
    minTide: 1.2,
    offshoreDirection: { from: 240, to: 330 },
    timezone: 'Asia/Tokyo'
  },
  // South
  komesu: {
    id: 'komesu',
    lat: 26.077,
    lon: 127.726,
    name: "Suicide Cliffs",
    region: 'Itoman',
    minTide: 1.6,
    offshoreDirection: { from: 315, to: 45 }, // N
    timezone: 'Asia/Tokyo'
  },
  kudaka: {
    id: 'kudaka',
    lat: 26.157,
    lon: 127.836,
    name: "Kudaka Island",
    region: 'Nanjo',
    minTide: 1.2,
    offshoreDirection: { from: 225, to: 315 },
    timezone: 'Asia/Tokyo'
  },
  // North
  aha: {
    id: 'aha',
    lat: 26.733,
    lon: 128.283,
    name: "Aha Yoko",
    region: 'Kunigami',
    minTide: 1.2,
    offshoreDirection: { from: 200, to: 290 }, // W
    timezone: 'Asia/Tokyo'
  },
  okuma: {
    id: 'okuma',
    lat: 26.740,
    lon: 128.155,
    name: "Okuma Beach",
    region: 'Kunigami',
    minTide: 1.0,
    offshoreDirection: { from: 45, to: 135 }, // E
    timezone: 'Asia/Tokyo'
  }
};
