
import React, { useState, useMemo } from 'react';
import { SurfSpot } from '../types';
import { triggerHaptic } from '../utils';
import { CompassIcon } from './icons';

interface SpotSelectorProps {
    spots: (SurfSpot & { distance: number })[];
    userLocation: { lat: number, lon: number } | null;
    onSelect: (id: string) => void;
}

export function SpotSelector({ spots, userLocation, onSelect }: SpotSelectorProps) {
    const [search, setSearch] = useState('');

    const filteredSpots = useMemo(() => {
        return spots.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.region.toLowerCase().includes(search.toLowerCase())
        );
    }, [spots, search]);

    const groupedSpots = useMemo(() => {
        const groups: { [key: string]: typeof spots } = {};
        filteredSpots.forEach(spot => {
            if (!groups[spot.region]) groups[spot.region] = [];
            groups[spot.region].push(spot);
        });
        return groups;
    }, [filteredSpots]);

    const handleSelect = (id: string) => {
        triggerHaptic([10]); // Sharp tap
        onSelect(id);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="sticky top-0 z-20 bg-mil-black pt-4 pb-2 px-4 border-b border-mil-border">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-mil-green font-bold text-xs animate-pulse">&gt;</span>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-8 pr-3 py-3 border border-mil-border bg-mil-panel text-mil-green placeholder-mil-green/30 focus:outline-none focus:border-mil-green focus:ring-1 focus:ring-mil-green text-sm font-mono uppercase tracking-wider transition-all"
                        placeholder="SEARCH_COORDINATES..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute top-0 right-0 -mt-1 -mr-1 w-2 h-2 border-t border-r border-mil-green opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -mb-1 -ml-1 w-2 h-2 border-b border-l border-mil-green opacity-50"></div>
                 </div>
            </div>

            <main className="flex-grow overflow-y-auto px-4 pb-32 no-scrollbar">
                {/* Nearest Header if GPS active */}
                {userLocation && !search && (
                    <div className="mt-4 mb-2 flex items-center justify-between">
                        <h2 className="text-[10px] font-bold text-mil-tan uppercase tracking-widest flex items-center">
                            <CompassIcon className="w-3 h-3 mr-2 text-mil-green" />
                            Proximity_Sort
                        </h2>
                        <div className="w-1.5 h-1.5 bg-mil-green rounded-full animate-pulse"></div>
                    </div>
                )}

                <div className="space-y-6 mt-4">
                    {Object.keys(groupedSpots).map((region) => (
                        <div key={region}>
                            <h3 className="sticky top-0 z-10 bg-mil-black/90 backdrop-blur-sm text-[10px] font-black text-mil-tan/70 uppercase tracking-[0.2em] py-2 border-b border-mil-border/30 mb-2">
                                /// {region} SECTOR
                            </h3>
                            <div className="grid gap-2">
                                {groupedSpots[region].map((spot, idx) => (
                                    <button
                                        key={spot.id}
                                        onClick={() => handleSelect(spot.id)}
                                        className="group relative w-full bg-mil-panel border border-mil-border hover:border-mil-green active:bg-mil-green/10 transition-all duration-150 p-4 text-left flex justify-between items-center"
                                    >
                                        {/* Corner Accents */}
                                        <div className="absolute top-0 left-0 w-0.5 h-2 bg-mil-border group-hover:bg-mil-green transition-colors"></div>
                                        <div className="absolute bottom-0 right-0 w-0.5 h-2 bg-mil-border group-hover:bg-mil-green transition-colors"></div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 bg-mil-border group-hover:bg-mil-green transition-colors"></div>
                                            <div>
                                                <span className="block font-bold text-base text-white group-hover:text-mil-green transition-colors tracking-tight">
                                                    {spot.name}
                                                </span>
                                                <span className="text-[9px] text-mil-tan/60 uppercase tracking-wide">
                                                    Reef Break // {spot.offshoreDirection.from}°-{spot.offshoreDirection.to}° Off
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {spot.distance !== Infinity && (
                                            <div className="text-right">
                                                <span className="block text-sm font-mono font-bold text-mil-tan group-hover:text-white">
                                                    {/* @ts-ignore */}
                                                    {spot.distance.toFixed(1)}
                                                    <span className="text-[9px] ml-1 text-mil-green/70">KM</span>
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {Object.keys(groupedSpots).length === 0 && (
                        <div className="text-center py-10 text-mil-tan/40 text-xs font-mono">
                            NO_TARGETS_FOUND_IN_SECTOR
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
