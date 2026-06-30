


import { WWO_API_URL, WWO_API_KEY } from '../constants';
import { HourlyWeatherData, SurfSpot, WWO_Response, WWO_HourlyData, WWO_WeatherDay, WWO_TideData } from '../types';
import { kmphToMs, directionToDegrees } from '../utils';

// Helper to parse time strings like "6:30 AM" into minutes from midnight
const timeToMinutes = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }
    return hours * 60 + minutes;
};

// Cosine interpolation for tide heights, optimized to O(H+E) complexity
const interpolateTide = (tideEvents: { time: number, height: number }[]): number[] => {
    const hourlyTides: number[] = new Array(48).fill(0);

    if (tideEvents.length < 2) {
        if (tideEvents.length === 1) return hourlyTides.fill(tideEvents[0].height);
        return hourlyTides;
    }

    let eventIndex = 0;
    for (let h = 0; h < 48; h++) {
        const currentTime = h * 60; // Current time in minutes from the start of the first day

        // Handle boundaries: before the first event or after the last event
        if (currentTime <= tideEvents[0].time) {
            hourlyTides[h] = tideEvents[0].height;
            continue;
        }
        if (currentTime >= tideEvents[tideEvents.length - 1].time) {
            hourlyTides[h] = tideEvents[tideEvents.length - 1].height;
            continue;
        }

        // Advance eventIndex to find the current interval O(1) amortized
        while (eventIndex < tideEvents.length - 2 && tideEvents[eventIndex + 1].time < currentTime) {
            eventIndex++;
        }
        
        const prevEvent = tideEvents[eventIndex];
        const nextEvent = tideEvents[eventIndex + 1];

        const timeDiff = nextEvent.time - prevEvent.time;
        if (timeDiff === 0) {
             hourlyTides[h] = prevEvent.height;
             continue;
        }

        const heightDiff = nextEvent.height - prevEvent.height;
        const timeProgress = (currentTime - prevEvent.time) / timeDiff;

        // Use cosine interpolation for a natural curve
        const interpolatedHeight = prevEvent.height + (heightDiff / 2) * (1 - Math.cos(timeProgress * Math.PI));
        hourlyTides[h] = interpolatedHeight;
    }
    return hourlyTides;
};

export const fetchWeatherData = async (spot: SurfSpot): Promise<{ hourly: HourlyWeatherData }> => {
    if (!WWO_API_KEY) {
        throw new Error("World Weather Online API key (WWO_API_KEY) is not configured in environment variables.");
    }

    const params = new URLSearchParams({
        key: WWO_API_KEY,
        q: `${spot.lat},${spot.lon}`,
        format: 'json',
        tide: 'yes',
        tp: '1', // 1-hour interval for weather data
    });

    try {
        const response = await fetch(`${WWO_API_URL}?${params}`);
        if (!response.ok) {
            const errorData: WWO_Response = await response.json();
            throw new Error(`World Weather Online API Error (${response.status}): ${errorData?.data?.error?.[0]?.msg || 'Unknown error'}`);
        }

        const data: WWO_Response = await response.json();
        const weather = data?.data?.weather;
        if (!weather || weather.length < 2) { // We need 2 days of data
            throw new Error("API response missing or has invalid format for weather data.");
        }

        // Combine hourly data from today and tomorrow
        const combinedHourly: WWO_HourlyData[] = [...weather[0].hourly, ...weather[1].hourly];
        
        const time: string[] = [];
        const wave_height: number[] = [];
        const wave_direction: number[] = [];
        const wave_period: number[] = [];
        const swell_wave_height: number[] = [];
        const swell_wave_direction: number[] = [];
        const swell_wave_period: number[] = [];
        const wind_speed_10m: number[] = [];
        const wind_direction_10m: number[] = [];
        const temperature_2m: number[] = [];
        const precipitation: number[] = [];
        
        combinedHourly.forEach((hour, index) => {
            const dayIndex = index < 24 ? 0 : 1;
            const date = weather[dayIndex].date;
            const hourValue = parseInt(hour.time, 10) / 100;
            const isoTime = new Date(`${date}T${String(hourValue).padStart(2, '0')}:00:00`).toISOString();
            
            time.push(isoTime);
            
            wave_height.push(parseFloat(hour.sigHeight_m || '0'));
            wave_direction.push(directionToDegrees(hour.swellDir16Point || ''));
            wave_period.push(parseFloat(hour.swellPeriod_secs || '0'));
            
            swell_wave_height.push(parseFloat(hour.swellHeight_m || '0'));
            swell_wave_direction.push(directionToDegrees(hour.swellDir16Point || ''));
            swell_wave_period.push(parseFloat(hour.swellPeriod_secs || '0'));
            
            wind_speed_10m.push(kmphToMs(parseFloat(hour.windspeedKmph || '0')));
            wind_direction_10m.push(directionToDegrees(hour.winddir16Point || ''));

            temperature_2m.push(parseFloat(hour.tempC || '0'));
            precipitation.push(parseFloat(hour.precipMM || '0'));
        });

        // Process and interpolate tide data
        const tideEvents: { time: number, height: number }[] = [];
        weather.forEach((day: WWO_WeatherDay, dayIndex: number) => {
             day.tides[0].tide_data.forEach((tide: WWO_TideData) => {
                 tideEvents.push({
                     time: timeToMinutes(tide.tideTime) + (dayIndex * 24 * 60),
                     height: parseFloat(tide.tideHeight_mt)
                 });
             });
        });
        tideEvents.sort((a,b) => a.time - b.time);
        
        const tide = interpolateTide(tideEvents);

        const transformedData: HourlyWeatherData = {
            time: time.slice(0, 48), // ensure we only have 48 hours
            tide: tide,
            wave_height,
            wave_direction,
            wave_period,
            swell_wave_height,
            swell_wave_direction,
            swell_wave_period,
            wind_speed_10m,
            wind_direction_10m,
            temperature_2m,
            precipitation
        };
        
        return { hourly: transformedData };

    } catch (error) {
        console.error(`World Weather Online API call failed:`, error);
        throw error;
    }
};