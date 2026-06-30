
import { TidePhase } from './types';

export const convert = {
  metersToFeet: (m: number): string => (m * 3.28084).toFixed(1),
  msToKnots: (ms: number): string => (ms * 1.94384).toFixed(0),
  celsiusToFahrenheit: (c: number): string => ((c * 9/5) + 32).toFixed(0),
  mmToInches: (mm: number): string => (mm / 25.4).toFixed(2),
};

// Tactical Haptic Feedback
export function triggerHaptic(pattern: number | number[] = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Haversine formula to calculate distance between two lat/lon points in km
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export function getWindDescription(windDirection: number, offshore: { from: number, to: number }): { text: string; color: string } {
    const from = offshore.from;
    const to = offshore.to;

    const isOffshore = (from < to) 
        ? (windDirection >= from && windDirection <= to)
        : (windDirection >= from || windDirection <= to);

    if (isOffshore) {
        return { text: "OFFSHORE", color: 'text-mil-green' };
    }

    const oppositeFrom = (from + 180) % 360;
    const oppositeTo = (to + 180) % 360;
    
    const isOnshore = (oppositeFrom < oppositeTo)
        ? (windDirection >= oppositeFrom && windDirection <= oppositeTo)
        : (windDirection >= oppositeFrom || windDirection <= oppositeTo);
    
    if (isOnshore) {
        return { text: "ONSHORE", color: 'text-mil-alert' };
    }

    return { text: "CROSS-SHORE", color: 'text-mil-warn' };
}

export function formatTimeAgo(date: Date | null): string {
    if (!date) return '...';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'NOW';
    if (seconds < 60) return `${seconds}S AGO`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M AGO`;

    const hours = Math.floor(minutes/60);
    return `${hours}H AGO`;
}

export function kmphToMs(kmph: number): number {
    return kmph / 3.6;
}

const compassDirections: { [key: string]: number } = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

export function directionToDegrees(direction: string): number {
    return compassDirections[direction.toUpperCase()] ?? 0;
}

export function getTidePhase(tide: number[], index: number): TidePhase {
    if (index < 0 || index >= tide.length - 1) {
        if (index > 0 && tide[index] < tide[index-1]) return 'falling';
        return 'rising';
    }
    const current = tide[index];
    const next = tide[index+1];
    const diff = next - current;
    if (Math.abs(diff) < 0.05) {
        return current > 1.8 ? 'peak high' : 'peak low';
    }
    return diff > 0 ? 'rising' : 'falling';
}
