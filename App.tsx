
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SURF_SPOTS } from './constants';
import { fetchWeatherData } from './services/meteoService';
import { generateSurfAnalysis, generateLocalIntel } from './services/geminiService';
import { WindArrowIcon, BackIcon, TideIcon, ThermometerIcon, PrecipitationIcon, ShareIcon } from './components/icons';
import { UnitToggle } from './components/UnitToggle';
import { DataCard } from './components/DataCard';
import { SkeletonCard } from './components/SkeletonCard';
import { TideChart } from './components/TideChart';
import { AiSummary } from './components/AiSummary';
import { LocalIntel } from './components/LocalIntel';
import { MapIntel } from './components/MapIntel';
import { VeoGenerator } from './components/VeoGenerator';
import { SwellCard } from './components/SwellCard';
import { SpotSelector } from './components/SpotSelector';
import { HourlyWeatherData, AIAnalysis, Conditions, SurfSpot, LocalIntelData } from './types';
import { convert, getWindDescription, getTidePhase, haversineDistance, triggerHaptic } from './utils';

type UnitSystem = 'metric' | 'imperial';
type Tab = 'sitrep' | 'recon' | 'sim';

type DataState = {
  loading: boolean;
  error: string | null;
  weatherData: HourlyWeatherData | null;
  
  aiAnalysis: AIAnalysis | null;
  aiLoading: boolean;
  aiError: string | null;

  localIntel: LocalIntelData | null;
  intelLoading: boolean;
};

export function App() {
    const [selectedSpotId, setSelectedSpotId] = useState<string | null>(() => sessionStorage.getItem('surfLastSpotId') || null);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => (sessionStorage.getItem('surfUnitSystem') as UnitSystem) || 'metric');
    const [tempUnit, setTempUnit] = useState<UnitSystem>(() => (sessionStorage.getItem('surfTempUnit') as UnitSystem) || 'metric');
    const [activeTab, setActiveTab] = useState<Tab>('sitrep');
    const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
    
    const [dataState, setDataState] = useState<DataState>({
        loading: true, error: null, weatherData: null, 
        aiAnalysis: null, aiLoading: false, aiError: null,
        localIntel: null, intelLoading: false
    });
    
    const selectedSpot: SurfSpot | null = useMemo(() => selectedSpotId ? SURF_SPOTS[selectedSpotId] : null, [selectedSpotId]);

    // Geolocation
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }),
                (err) => console.warn("Geolocation denied", err)
            );
        }
    }, []);
    
    // Combined Sorted Spot List
    const spotList = useMemo(() => {
        const spots = Object.values(SURF_SPOTS).map(spot => {
            let distance = Infinity;
            if (userLocation) {
                distance = haversineDistance(userLocation.lat, userLocation.lon, spot.lat, spot.lon);
            }
            return { ...spot, distance };
        });

        if (userLocation) {
            return spots.sort((a, b) => a.distance - b.distance);
        }
        return spots.sort((a, b) => a.region.localeCompare(b.region));
    }, [userLocation]);

    // Persist
    useEffect(() => {
        if (selectedSpotId) sessionStorage.setItem('surfLastSpotId', selectedSpotId);
        sessionStorage.setItem('surfUnitSystem', unitSystem);
        sessionStorage.setItem('surfTempUnit', tempUnit);
    }, [selectedSpotId, unitSystem, tempUnit]);

    // Fetch Data
    const fetchData = useCallback(async (spot: SurfSpot) => {
        setDataState(prev => ({ ...prev, loading: true, error: null, aiAnalysis: null, weatherData: null, aiError: null, localIntel: null }));
        try {
            const weatherRes = await fetchWeatherData(spot);
            setDataState(prev => ({ ...prev, loading: false, weatherData: weatherRes.hourly }));
        } catch (err) {
            setDataState(prev => ({ ...prev, loading: false, error: (err as Error).message, weatherData: null }));
        }
    }, []);

    useEffect(() => {
        if (selectedSpot) {
            fetchData(selectedSpot);
            setActiveTab('sitrep');
        }
    }, [selectedSpot, fetchData]);

    // AI Logic
    useEffect(() => {
        if(dataState.weatherData && selectedSpot) {
            const hour = new Date().getHours();
            const conditions: Conditions = {
                waveHeight: dataState.weatherData.wave_height[hour],
                wavePeriod: dataState.weatherData.wave_period[hour],
                waveDirection: dataState.weatherData.wave_direction[hour],
                windSpeed: dataState.weatherData.wind_speed_10m[hour],
                windDirection: dataState.weatherData.wind_direction_10m[hour],
                currentTide: dataState.weatherData.tide[hour],
                tidePhase: getTidePhase(dataState.weatherData.tide, hour)
            };

            setDataState(prev => ({ ...prev, aiLoading: true }));
            generateSurfAnalysis(conditions)
                .then(analysis => setDataState(prev => ({ ...prev, aiAnalysis: analysis, aiLoading: false })))
                .catch(err => setDataState(prev => ({ ...prev, aiAnalysis: null, aiLoading: false, aiError: err.message })));

            setDataState(prev => ({ ...prev, intelLoading: true }));
            generateLocalIntel(selectedSpot.region)
                .then(intel => setDataState(prev => ({ ...prev, localIntel: intel, intelLoading: false })))
                .catch(() => setDataState(prev => ({ ...prev, intelLoading: false })));
        }
    }, [dataState.weatherData, selectedSpot]);

    const current = useMemo(() => {
        if (!dataState.weatherData || !selectedSpot) return null;
        const hour = new Date().getHours();
        return {
            ...dataState.weatherData,
            waveHeight: dataState.weatherData.wave_height[hour],
            swellHeight: dataState.weatherData.swell_wave_height[hour],
            swellPeriod: dataState.weatherData.swell_wave_period[hour],
            swellDirection: dataState.weatherData.swell_wave_direction[hour],
            windSpeed: dataState.weatherData.wind_speed_10m[hour],
            windDirection: dataState.weatherData.wind_direction_10m[hour],
            windDesc: getWindDescription(dataState.weatherData.wind_direction_10m[hour], selectedSpot.offshoreDirection),
            tide: dataState.weatherData.tide[hour],
            tidePhase: getTidePhase(dataState.weatherData.tide, hour),
            temp: dataState.weatherData.temperature_2m[hour],
            precip: dataState.weatherData.precipitation[hour],
        };
    }, [dataState.weatherData, selectedSpot]);
    
    const currentTimeIndex = new Date().getHours();
    
    const handleShare = () => {
        triggerHaptic([50]);
        if (current && selectedSpot) {
            const text = `SITREP // ${selectedSpot.name.toUpperCase()}\nSWL: ${current.swellHeight}m @ ${current.swellPeriod}s\nWND: ${current.windDesc.text} (${current.windSpeed}m/s)\nTIDE: ${current.tide}m (${current.tidePhase.toUpperCase()})\n\nGenerated by SOTA Surf`;
            if (navigator.share) {
                navigator.share({ title: 'SOTA Report', text: text }).catch(console.error);
            } else {
                navigator.clipboard.writeText(text).then(() => alert("INTEL COPIED TO CLIPBOARD"));
            }
        }
    };

    const handleTabChange = (tab: Tab) => {
        triggerHaptic(15);
        setActiveTab(tab);
    };

    const handleUnitToggle = (type: 'dist' | 'temp') => {
        triggerHaptic(10);
        if (type === 'dist') setUnitSystem(s => s === 'metric' ? 'imperial' : 'metric');
        if (type === 'temp') setTempUnit(s => s === 'metric' ? 'imperial' : 'metric');
    };

    // --- LANDING PAGE ---
    if (!selectedSpot) {
        return (
            <div className="flex flex-col h-full bg-mil-black safe-top pb-safe relative overflow-hidden">
                {/* Header */}
                <header className="flex-none pt-6 pb-4 px-6 border-b border-mil-border bg-mil-black/95 z-10 shadow-lg">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-mil-green">S.O.T.A.</h1>
                            <p className="text-[10px] font-bold text-mil-tan uppercase tracking-[0.2em]">Tactical Surf Command</p>
                        </div>
                        <div className="flex flex-col items-end">
                             <div className="w-2 h-2 rounded-full bg-mil-green animate-pulse mb-1"></div>
                             <p className="text-[9px] text-mil-border uppercase">UPLINK ESTABLISHED</p>
                        </div>
                    </div>
                </header>

                <SpotSelector 
                    spots={spotList} 
                    userLocation={userLocation} 
                    onSelect={setSelectedSpotId} 
                />
            </div>
        )
    }

    // --- DASHBOARD ---
    return (
        <div className="flex flex-col h-full bg-mil-black safe-top safe-bottom overflow-hidden font-mono">
            {/* Top Bar */}
            <header className="flex-none relative z-20 bg-mil-black border-b border-mil-border px-4 py-2">
                <div className="flex justify-between items-center mb-2">
                    <button 
                        onClick={() => { triggerHaptic(20); setSelectedSpotId(null); }} 
                        className="group flex items-center text-mil-tan hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest px-3 py-2 border border-mil-border/30 hover:bg-mil-border/20 active:bg-mil-green/20 rounded-sm"
                    >
                        <BackIcon className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Return_To_Base
                    </button>
                    <UnitToggle 
                        unitSystem={unitSystem} 
                        onUnitSystemToggle={() => handleUnitToggle('dist')}
                        tempUnit={tempUnit}
                        onTempUnitToggle={() => handleUnitToggle('temp')}
                    />
                </div>
                
                <div className="flex items-end justify-between pb-3 mt-2">
                     <div>
                         <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate max-w-[220px]">{selectedSpot.name}</h1>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-mil-green font-bold uppercase tracking-[0.2em] bg-mil-green/10 px-1 border border-mil-green/20">{selectedSpot.region}</span>
                            <span className="text-[9px] text-mil-tan uppercase">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                     </div>
                     <button onClick={handleShare} className="p-2 text-mil-green hover:text-white active:scale-95 transition-all">
                        <ShareIcon className="w-5 h-5" />
                     </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1 mt-1 bg-mil-border/20 p-1 rounded-md">
                     {(['sitrep', 'recon', 'sim'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`
                                py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm
                                ${activeTab === tab 
                                    ? 'bg-mil-green text-black shadow-[0_0_10px_rgba(51,255,51,0.4)]' 
                                    : 'bg-transparent text-mil-tan hover:bg-mil-tan/10'}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* Scroll Content */}
            <main className="flex-grow overflow-y-auto no-scrollbar p-4 pb-32 space-y-4 bg-grid-pattern bg-grid relative">
                {/* Background Overlay for Depth */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 to-black/50 z-0"></div>

                {dataState.error && (
                    <div className="relative z-10 border border-mil-alert bg-mil-alert/10 p-4 text-mil-alert font-bold text-xs uppercase tracking-widest flex items-center animate-pulse">
                        <div className="w-2 h-2 bg-mil-alert animate-blink mr-2"></div>
                        ERR: {dataState.error}
                    </div>
                )}

                {dataState.loading ? (
                    <div className="relative z-10 grid grid-cols-2 gap-3 mt-2">
                         <SkeletonCard className="h-32 col-span-2" />
                         <SkeletonCard className="h-32" />
                         <SkeletonCard className="h-32" />
                    </div>
                ) : !dataState.error && current && (
                    <div className="relative z-10">
                        {activeTab === 'sitrep' && (
                            <div className="animate-fade-in space-y-3">
                                {/* Primary Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <SwellCard 
                                            swellHeight={unitSystem === 'metric' ? current.swellHeight.toFixed(1) : convert.metersToFeet(current.swellHeight)}
                                            unit={unitSystem === 'metric' ? 'M' : 'FT'}
                                            swellPeriod={`${current.swellPeriod.toFixed(0)}s`}
                                            swellDirection={current.swellDirection}
                                        />
                                    </div>
                                    
                                    <DataCard
                                        icon={<WindArrowIcon rotation={current.windDirection} className="w-4 h-4"/>}
                                        label="Wind"
                                        subLabel={current.windDesc.text}
                                        subLabelColorClass={current.windDesc.color}
                                        value={unitSystem === 'metric' ? current.windSpeed.toFixed(1) : convert.msToKnots(current.windSpeed)}
                                        unit={unitSystem === 'metric' ? 'm/s' : 'kn'}
                                    />
                                    
                                    <DataCard
                                        icon={<TideIcon className="w-4 h-4"/>}
                                        label="Tide"
                                        subLabel={current.tidePhase}
                                        value={current.tide.toFixed(2)}
                                        unit="m"
                                        colorClass={current.tide < selectedSpot.minTide ? 'text-mil-alert' : 'text-mil-green'}
                                    />

                                    <DataCard
                                        icon={<ThermometerIcon className="w-4 h-4"/>}
                                        label="Temp"
                                        value={tempUnit === 'metric' ? current.temp.toFixed(0) : convert.celsiusToFahrenheit(current.temp)}
                                        unit={tempUnit === 'metric' ? '°C' : '°F'}
                                    />

                                    <DataCard
                                        icon={<PrecipitationIcon className="w-4 h-4"/>}
                                        label="Rain"
                                        value={unitSystem === 'metric' ? current.precip.toFixed(1) : convert.mmToInches(current.precip)}
                                        unit={unitSystem === 'metric' ? 'mm' : 'in'}
                                        colorClass={current.precip > 0 ? 'text-mil-warn' : 'text-mil-green'}
                                    />
                                </div>
                                
                                {/* Tide Chart */}
                                <div className="h-56">
                                    <TideChart weatherData={dataState.weatherData!} minTide={selectedSpot.minTide} currentTimeIndex={currentTimeIndex}/>
                                </div>

                                {/* AI */}
                                <AiSummary analysis={dataState.aiAnalysis} isLoading={dataState.aiLoading} error={dataState.aiError} />
                            </div>
                        )}

                        {activeTab === 'recon' && (
                            <div className="animate-fade-in space-y-3 h-full">
                                <LocalIntel data={dataState.localIntel} isLoading={dataState.intelLoading} />
                                <div className="h-[400px]">
                                    <MapIntel lat={selectedSpot.lat} lon={selectedSpot.lon} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'sim' && (
                            <div className="animate-fade-in h-full pb-10">
                                <VeoGenerator spotName={selectedSpot.name} />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
