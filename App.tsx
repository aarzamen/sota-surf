
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SURF_SPOTS } from './constants';
import { fetchWeatherData } from './services/meteoService';
import { generateSurfAnalysis, generateLocalIntel } from './services/geminiService';
import { WindArrowIcon, BackIcon, TideIcon, ThermometerIcon, PrecipitationIcon, ShareIcon, SettingsIcon } from './components/icons';
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
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [tideThreshold, setTideThreshold] = useState<number>(() => {
        const saved = localStorage.getItem('surf_tide_threshold');
        return saved ? parseFloat(saved) : 1.0;
    });
    const [showSettings, setShowSettings] = useState<boolean>(false);
    
    const [dataState, setDataState] = useState<DataState>({
        loading: true, error: null, weatherData: null, 
        aiAnalysis: null, aiLoading: false, aiError: null,
        localIntel: null, intelLoading: false
    });
    
    const selectedSpot: SurfSpot | null = useMemo(() => selectedSpotId ? SURF_SPOTS[selectedSpotId] : null, [selectedSpotId]);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

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

    useEffect(() => {
        localStorage.setItem('surf_tide_threshold', tideThreshold.toString());
    }, [tideThreshold]);

    // Fetch Data
    const fetchData = useCallback(async (spot: SurfSpot) => {
        setDataState(prev => ({ ...prev, loading: true, error: null, aiAnalysis: null, weatherData: null, aiError: null, localIntel: null }));
        try {
            const weatherRes = await fetchWeatherData(spot);
            // Save to localStorage for robust offline access
            localStorage.setItem(`surf_weather_data_${spot.id}`, JSON.stringify(weatherRes.hourly));
            setDataState(prev => ({ ...prev, loading: false, weatherData: weatherRes.hourly }));
        } catch (err) {
            // Check localStorage if API call fails
            const cachedWeather = localStorage.getItem(`surf_weather_data_${spot.id}`);
            if (cachedWeather) {
                try {
                    const parsedWeather = JSON.parse(cachedWeather);
                    setDataState(prev => ({ ...prev, loading: false, weatherData: parsedWeather, error: null }));
                    return;
                } catch (e) {
                    console.error("Failed to parse cached weather data", e);
                }
            }
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
                .then(analysis => {
                    localStorage.setItem(`surf_ai_analysis_${selectedSpot.id}`, JSON.stringify(analysis));
                    setDataState(prev => ({ ...prev, aiAnalysis: analysis, aiLoading: false, aiError: null }));
                })
                .catch(err => {
                    // Fall back to cached analysis offline
                    const cachedAnalysis = localStorage.getItem(`surf_ai_analysis_${selectedSpot.id}`);
                    if (cachedAnalysis) {
                        try {
                            const parsedAnalysis = JSON.parse(cachedAnalysis);
                            setDataState(prev => ({ ...prev, aiAnalysis: parsedAnalysis, aiLoading: false, aiError: null }));
                            return;
                        } catch (e) {
                            console.error("Failed to parse cached AI analysis", e);
                        }
                    }
                    setDataState(prev => ({ ...prev, aiAnalysis: null, aiLoading: false, aiError: err.message }));
                });

            setDataState(prev => ({ ...prev, intelLoading: true }));
            generateLocalIntel(selectedSpot.region)
                .then(intel => {
                    localStorage.setItem(`surf_local_intel_${selectedSpot.id}`, JSON.stringify(intel));
                    setDataState(prev => ({ ...prev, localIntel: intel, intelLoading: false }));
                })
                .catch(() => {
                    // Fall back to cached local intel offline
                    const cachedIntel = localStorage.getItem(`surf_local_intel_${selectedSpot.id}`);
                    if (cachedIntel) {
                        try {
                            const parsedIntel = JSON.parse(cachedIntel);
                            setDataState(prev => ({ ...prev, localIntel: parsedIntel, intelLoading: false }));
                            return;
                        } catch (e) {
                            console.error("Failed to parse cached local intel", e);
                        }
                    }
                    setDataState(prev => ({ ...prev, intelLoading: false }));
                });
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
                             <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-mil-green' : 'bg-mil-alert'} animate-pulse mb-1`}></div>
                             <p className={`text-[9px] font-bold uppercase ${isOnline ? 'text-mil-border' : 'text-mil-alert'}`}>
                                 {isOnline ? 'UPLINK ESTABLISHED' : 'LINK OFFLINE // LOCAL STORAGE'}
                             </p>
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
                    <div className="flex items-center gap-2">
                        <UnitToggle 
                            unitSystem={unitSystem} 
                            onUnitSystemToggle={() => handleUnitToggle('dist')}
                            tempUnit={tempUnit}
                            onTempUnitToggle={() => handleUnitToggle('temp')}
                        />
                        <button 
                            onClick={() => { triggerHaptic(15); setShowSettings(!showSettings); }}
                            className={`p-2 border rounded-sm transition-colors mt-2 shrink-0 ${showSettings ? 'border-mil-green bg-mil-green/10 text-mil-green shadow-[0_0_8px_rgba(51,255,51,0.2)]' : 'border-mil-border/50 text-mil-tan hover:text-white hover:bg-mil-border/25'}`}
                            title="Tactical Settings"
                        >
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-end justify-between pb-3 mt-2">
                     <div>
                         <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate max-w-[220px]">{selectedSpot.name}</h1>
                         <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] text-mil-green font-bold uppercase tracking-[0.2em] bg-mil-green/10 px-1 border border-mil-green/20">{selectedSpot.region}</span>
                            {!isOnline && (
                                <span className="text-[9px] text-mil-alert font-bold uppercase tracking-[0.2em] bg-mil-alert/10 px-1.5 border border-mil-alert/30 animate-pulse">OFFLINE MODE // CACHED DATA</span>
                            )}
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

            {/* Tactical Settings Panel */}
            {showSettings && (
                <div className="bg-mil-panel border-b border-mil-border p-4 space-y-4 animate-slide-up relative z-20">
                    <div className="flex justify-between items-center pb-2 border-b border-mil-border/50">
                        <span className="text-xs font-black tracking-widest uppercase text-mil-green font-mono">SOTA_CONFIG // PARAMETERS</span>
                        <button 
                            onClick={() => setShowSettings(false)} 
                            className="text-[10px] text-mil-tan hover:text-white uppercase font-bold tracking-wider font-mono"
                        >
                            [CLOSE]
                        </button>
                    </div>
                    
                    {/* Minimum Tide Parameter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-mil-tan uppercase tracking-wider font-mono">
                                MINIMUM TIDE THRESHOLD
                            </label>
                            <span className="text-xs font-black text-mil-green bg-mil-green/10 px-2 py-0.5 border border-mil-green/20 rounded font-mono">
                                {tideThreshold.toFixed(2)}m
                            </span>
                        </div>
                        
                        <p className="text-[9px] text-mil-tan-dark uppercase leading-relaxed tracking-wide font-mono">
                            Set your absolute safe operational minimum tide limit. When tide conditions fall below this value, SOTA triggers alert telemetry on your dashboard.
                        </p>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    triggerHaptic(5);
                                    setTideThreshold(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))));
                                }}
                                className="px-3 py-1.5 border border-mil-border text-mil-green hover:bg-mil-border/50 rounded text-sm font-bold select-none active:bg-mil-green/15 font-mono animate-pulse"
                            >
                                -
                            </button>
                            <input 
                                type="range" 
                                min="0.0" 
                                max="3.0" 
                                step="0.1" 
                                value={tideThreshold} 
                                onChange={(e) => {
                                    triggerHaptic(5);
                                    setTideThreshold(parseFloat(e.target.value));
                                }}
                                className="flex-1 accent-mil-green h-1 bg-mil-border rounded-lg appearance-none cursor-pointer font-mono"
                            />
                            <button 
                                onClick={() => {
                                    triggerHaptic(5);
                                    setTideThreshold(prev => Math.min(3.0, parseFloat((prev + 0.1).toFixed(1))));
                                }}
                                className="px-3 py-1.5 border border-mil-border text-mil-green hover:bg-mil-border/50 rounded text-sm font-bold select-none active:bg-mil-green/15 font-mono animate-pulse"
                            >
                                +
                            </button>
                        </div>
                        
                        {selectedSpot && (
                            <div className="text-[9px] text-mil-tan uppercase bg-mil-black/50 p-2 border border-mil-border/30 rounded mt-1 flex justify-between items-center font-mono">
                                <span>SPOT SPECIFIC BENCHMARK ({selectedSpot.name}):</span>
                                <span className="font-bold text-white underline font-mono">{selectedSpot.minTide.toFixed(2)}m</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                    <div className="relative z-10 space-y-3">
                        {/* Threshold Tide visual alert */}
                        {current.tide < tideThreshold && (
                            <div className="border border-mil-alert bg-mil-alert/10 p-3 text-mil-alert rounded-md animate-pulse shadow-[0_0_15px_rgba(255,51,51,0.25)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 font-mono text-[8px] bg-mil-alert/20 text-white select-none">
                                    ALRT_092
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 flex items-center justify-center rounded bg-mil-alert/20 text-mil-alert shrink-0 mt-0.5">
                                        <span className="font-bold text-xs font-mono">!</span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-[11px] font-black tracking-widest uppercase text-white font-mono">TACTICAL WARNING: LOW TIDE ACTIVE</p>
                                        <p className="text-[10px] text-mil-alert uppercase leading-relaxed tracking-wider font-mono">
                                            CURRENT TIDE LEVEL IS <span className="font-bold underline">{current.tide.toFixed(2)}m</span>, WHICH DROPPED BELOW YOUR SET MINIMUM SAFE OPERATIONAL PREFERENCE OF <span className="font-bold underline">{tideThreshold.toFixed(2)}m</span>. SHALLOW REEF RISK HIGH.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                        colorClass={current.tide < tideThreshold ? 'text-mil-alert animate-pulse' : 'text-mil-green'}
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
                                    <TideChart weatherData={dataState.weatherData!} minTide={tideThreshold} currentTimeIndex={currentTimeIndex}/>
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
