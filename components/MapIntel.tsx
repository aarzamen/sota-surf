
import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { Loader } from './Loader';
import { NearbyPlace } from '../types';
import { generateNearbyPlaces } from '../services/geminiService';

interface MapIntelProps {
    lat: number;
    lon: number;
}

export function MapIntel({ lat, lon }: MapIntelProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ text: string, places: NearbyPlace[] } | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        
        generateNearbyPlaces(lat, lon)
            .then(result => {
                if (mounted) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [lat, lon]);

    if (loading) {
        return (
             <Card className="h-full min-h-[200px] flex flex-col items-center justify-center">
                <span className="text-xs text-tac-tan animate-pulse uppercase tracking-widest">Aligning Satellite...</span>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col border-tac-gray">
            <div className="flex items-center mb-4 border-b border-tac-gray pb-2">
                <svg className="w-5 h-5 mr-2 text-tac-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Sat_Recon // Grid Ref</h3>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                <div className="text-xs text-tac-tan font-mono bg-tac-gray/30 p-3 border-l-2 border-tac-green">
                    {data?.text}
                </div>

                <div className="grid gap-2">
                    {data?.places.map((place, idx) => (
                        <a 
                            key={idx} 
                            href={place.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 border border-tac-gray hover:border-tac-green transition-all group bg-black"
                        >
                            <span className="font-bold text-xs text-white group-hover:text-tac-green truncate max-w-[80%] uppercase">{place.title}</span>
                            <div className="w-2 h-2 bg-tac-gray group-hover:bg-tac-green rounded-full"></div>
                        </a>
                    ))}
                </div>
            </div>
        </Card>
    );
}
