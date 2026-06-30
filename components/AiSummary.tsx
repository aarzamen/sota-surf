
import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { BrainIcon } from './icons';
import { AIAnalysis } from '../types';

interface AiSummaryProps {
    analysis: AIAnalysis | null;
    isLoading: boolean;
    error: string | null;
}

function AiSummaryComponent({ analysis, isLoading, error }: AiSummaryProps) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        if (analysis?.description) {
            setDisplayedText("");
            let i = 0;
            const timer = setInterval(() => {
                setDisplayedText(analysis.description.substring(0, i + 1));
                i++;
                if (i === analysis.description.length) clearInterval(timer);
            }, 15); // Speed of typing
            return () => clearInterval(timer);
        }
    }, [analysis]);

    if (isLoading) {
        return (
            <Card className="min-h-[200px] flex flex-col items-center justify-center border-dashed border-mil-green/30 bg-mil-black">
                <div className="text-mil-green animate-pulse text-4xl font-black tracking-widest mb-2">///</div>
                <div className="text-[10px] font-mono text-mil-green uppercase tracking-[0.2em] animate-pulse">Computing Vector Analysis</div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="alert" className="flex flex-col justify-center items-center text-center min-h-[150px]">
                <h3 className="text-xs font-bold text-mil-alert uppercase tracking-widest mb-2">[ SYSTEM_FAILURE ]</h3>
                <p className="text-[10px] text-mil-tan px-4">{error}</p>
            </Card>
        );
    }
    
    if (!analysis) return null;

    const getRiskColor = (level: string) => {
        const l = level.toUpperCase();
        if (l.includes('RED') || l.includes('EXPERT') || l.includes('BLACK')) return 'text-mil-alert';
        if (l.includes('YELLOW') || l.includes('MODERATE')) return 'text-mil-warn';
        return 'text-mil-green';
    };

    return (
        <Card className="flex flex-col border-t-4 border-t-mil-green shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-mil-border pb-2 mb-3">
                <div className="flex items-center">
                    <BrainIcon className="w-3 h-3 text-mil-green mr-2" />
                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Tactical_Assessment</h3>
                </div>
                <div className="px-1.5 py-0.5 bg-mil-green/10 border border-mil-green/30 text-[8px] font-bold text-mil-green animate-pulse">
                    V3.0-PRO
                </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-mil-tan uppercase tracking-wider mb-0.5">Threat_Level</span>
                    <span className={`text-sm font-black font-mono ${getRiskColor(analysis.safety.level)} uppercase`}>{analysis.safety.level}</span>
                 </div>
                 <div className="text-right">
                     <div className="text-3xl font-black text-white tracking-tighter leading-none">{analysis.surfScore.toFixed(1)}</div>
                     <div className="text-[8px] text-mil-tan uppercase tracking-widest">Q_Index</div>
                 </div>
            </div>

            <div className="bg-mil-black p-3 border border-mil-border text-xs font-mono leading-relaxed relative overflow-hidden min-h-[60px]">
                <div className="absolute top-0 left-0 w-1 h-full bg-mil-green"></div>
                <p className="text-mil-green/90 pl-2">
                    <span className="text-mil-tan mr-2">&gt;</span>
                    {displayedText}
                    <span className="animate-blink inline-block w-1.5 h-3 bg-mil-green ml-1 align-middle"></span>
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mt-3 text-[9px] uppercase tracking-wide">
                <div className="flex justify-between border-b border-mil-border/50 pb-1">
                    <span className="text-mil-tan">Hazards</span>
                    <span className="text-white text-right font-bold">{analysis.safety.details}</span>
                </div>
                <div className="flex justify-between border-b border-mil-border/50 pb-1">
                    <span className="text-mil-tan">Operator_Skill</span>
                    <span className="text-white text-right font-bold">{analysis.skillLevel}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-mil-tan">Window</span>
                    <span className="text-mil-green text-right font-bold">{analysis.timing}</span>
                </div>
            </div>
        </Card>
    );
}

export const AiSummary = React.memo(AiSummaryComponent);
