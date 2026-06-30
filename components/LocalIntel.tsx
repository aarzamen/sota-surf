
import React from 'react';
import { Card } from './Card';
import { InfoIcon } from './icons';
import { LocalIntelData } from '../types';

interface LocalIntelProps {
    data: LocalIntelData | null;
    isLoading: boolean;
}

export function LocalIntel({ data, isLoading }: LocalIntelProps) {
    if (isLoading) {
        return (
            <Card className="min-h-[100px] flex items-center justify-center border-dashed border-tac-tan/20">
                <span className="text-xs text-tac-tan animate-pulse font-mono uppercase">[ DECRYPTING_LOCAL_CHANNELS... ]</span>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className="bg-tac-gray/20">
            <div className="flex items-center mb-3 border-b border-tac-gray pb-2">
                <InfoIcon className="w-4 h-4 text-tac-tan mr-2" />
                <h3 className="text-xs font-bold text-tac-tan uppercase tracking-widest">Intel // Intercepted Comms</h3>
            </div>
            
            <div className="font-mono text-sm">
                <div className="text-tac-green mb-4 whitespace-pre-line leading-relaxed">
                    {data.summary}
                </div>
                
                {data.sources.length > 0 && (
                    <div className="border-t border-tac-gray pt-2 mt-2">
                        <span className="text-[9px] text-tac-tan uppercase block mb-1">Origins</span>
                        <div className="flex flex-wrap gap-2">
                            {data.sources.slice(0, 3).map((source, idx) => (
                                <a 
                                    key={idx} 
                                    href={source.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-white hover:text-tac-green underline truncate max-w-[150px]"
                                >
                                    {source.title}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
