
import React, { useMemo, useRef, useEffect } from 'react';
import { Card } from './Card';
import { TideIcon } from './icons';
import { HourlyWeatherData } from '../types';

interface TideChartProps {
    weatherData: HourlyWeatherData;
    minTide: number;
    currentTimeIndex: number;
}

function TideChartComponent({ weatherData, minTide, currentTimeIndex }: TideChartProps) {
    const chartData = useMemo(() => weatherData.tide.slice(0, 24).map((t, i) => ({
        time: new Date(weatherData.time[i]).getHours(),
        tide: t
    })), [weatherData]);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentHourRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current && currentHourRef.current) {
            const containerWidth = scrollContainerRef.current.offsetWidth;
            const scrollLeft = currentHourRef.current.offsetLeft - (containerWidth / 2) + (currentHourRef.current.offsetWidth / 2);
            scrollContainerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, [currentTimeIndex]);

    return (
        <Card className="h-full">
            <h3 className="text-xs font-bold text-tac-tan uppercase tracking-widest mb-2 flex items-center"><TideIcon className="w-4 h-4 mr-2" /> Tide_Sequence_24H</h3>
            <div ref={scrollContainerRef} className="h-32 w-full relative overflow-x-auto pb-4 no-scrollbar">
                <div className="relative h-full min-w-[40rem] pr-4 pt-4">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 border-b border-tac-gray"></div>
                    
                    {chartData.map((dataPoint, index) => {
                        const isSurfable = dataPoint.tide >= minTide;
                        const isCurrent = index === currentTimeIndex;
                        const barHeight = `${(dataPoint.tide / 3.0) * 100}%`;
                        
                        return (
                            <div 
                                key={index} 
                                ref={isCurrent ? currentHourRef : null}
                                className="absolute bottom-0 h-full flex flex-col justify-end items-center group" 
                                style={{ left: `${(index / 24) * 100}%`, width: `${100 / 24}%`}}
                            >
                                <div 
                                    className={`w-1/2 transition-all duration-300 border-t border-l border-r 
                                        ${isSurfable ? 'bg-tac-green/20 border-tac-green' : 'bg-tac-alert/20 border-tac-alert'}
                                        ${isCurrent ? 'bg-tac-green border-tac-green shadow-[0_0_10px_#33ff33]' : ''}
                                    `} 
                                    style={{height: barHeight}}
                                ></div>
                                <span className="absolute -bottom-5 text-[9px] text-tac-tan font-mono">{index % 3 === 0 ? `${dataPoint.time}00` : ''}</span>
                            </div>
                        )
                    })}

                    {/* Min Tide Line */}
                    <div className="absolute w-full border-t border-dashed border-tac-warn" style={{bottom: `${(minTide / 3.0) * 100}%`}}>
                       <span className="absolute right-0 -top-3 text-[9px] text-tac-warn bg-black px-1">MIN: {minTide}m</span>
                    </div>

                    {/* Time Indicator */}
                    {currentTimeIndex >= 0 && currentTimeIndex < 24 && (
                        <div 
                            className="absolute bottom-0 h-full pointer-events-none border-l border-tac-green" 
                            style={{ 
                                left: `${((currentTimeIndex + new Date().getMinutes() / 60) / 24) * 100}%`,
                            }}
                        >
                             <div className="absolute -top-2 -left-1 w-2 h-2 bg-tac-green rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

export const TideChart = React.memo(TideChartComponent);
