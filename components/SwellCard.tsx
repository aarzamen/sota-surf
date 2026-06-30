
import React from 'react';
import { Card } from './Card';
import { WaveIcon, SwellArrowIcon } from './icons';

interface SwellCardProps {
    swellHeight: string;
    unit: string;
    swellPeriod: string;
    swellDirection: number;
    sourceLine?: string;
}

function SwellCardComponent({ swellHeight, unit, swellPeriod, swellDirection, sourceLine }: SwellCardProps) {
    return (
        <Card className="border-mil-green shadow-[0_0_10px_rgba(51,255,51,0.15)] bg-mil-panel/80">
            <div className="flex items-center justify-between border-b border-mil-green/30 pb-2 mb-3">
                <div className="flex items-center text-mil-green">
                    <WaveIcon className="w-4 h-4" />
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">Local Breaking Estimate</span>
                </div>
                <div className="w-2 h-2 bg-mil-green rounded-full animate-pulse"></div>
            </div>
            {sourceLine && (
                <div className="mb-3 text-[9px] text-mil-tan uppercase tracking-wider font-mono bg-mil-green/5 border border-mil-green/15 px-2 py-1">
                    {sourceLine}
                </div>
            )}
            
            <div className="grid grid-cols-3 divide-x divide-mil-border">
                 <div className="flex flex-col items-center px-2">
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black text-white tracking-tighter">{swellHeight}</span>
                        <span className="text-xs ml-1 text-mil-tan font-bold">{unit}</span>
                    </div>
                    <span className="text-[8px] text-mil-tan uppercase tracking-wider mt-1">Amplitude</span>
                </div>
                
                <div className="flex flex-col items-center px-2">
                    <span className="text-4xl font-black text-white tracking-tighter">{swellPeriod}</span>
                    <span className="text-[8px] text-mil-tan uppercase tracking-wider mt-1">Buoy Period</span>
                </div>
                
                <div className="flex flex-col items-center justify-center px-2">
                    <div className="border border-mil-green/50 p-1.5 rounded-full mb-1 bg-mil-green/10">
                         <SwellArrowIcon rotation={swellDirection} className="h-5 w-5 text-mil-green"/>
                    </div>
                    <span className="text-[8px] text-mil-tan font-mono">Buoy {swellDirection.toFixed(0)}°</span>
                </div>
            </div>
        </Card>
    );
}

export const SwellCard = React.memo(SwellCardComponent);
