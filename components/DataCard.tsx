
import React from 'react';
import { Card } from './Card';

interface DataCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | React.ReactNode;
    unit?: string;
    colorClass?: string;
    style?: React.CSSProperties;
    subLabel?: string;
    subLabelColorClass?: string;
}

function DataCardComponent({ icon, label, value, unit, colorClass = 'text-mil-green', style, subLabel, subLabelColorClass }: DataCardProps) {
    const textColor = colorClass.replace('tac-', 'mil-'); // Quick fix for legacy names if any
    const subColor = subLabelColorClass ? subLabelColorClass.replace('tac-', 'mil-') : 'text-mil-tan';

    return (
        <Card className="flex flex-col justify-between min-h-[100px]" style={style}>
            <div className="flex items-start justify-between">
                <div className="flex items-center text-mil-tan/70">
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' })}
                    <span className="ml-1.5 text-[9px] font-bold uppercase tracking-[0.1em]">{label}</span>
                </div>
                {subLabel && (
                    <span className={`text-[8px] font-bold px-1 border border-current ${subColor}`}>
                        {subLabel.toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex items-baseline mt-2">
                <span className={`text-3xl font-black tracking-tighter ${textColor}`}>{value}</span>
                {unit && <span className="text-[10px] ml-1 text-mil-tan/60 font-bold">{unit}</span>}
            </div>
        </Card>
    );
}

export const DataCard = React.memo(DataCardComponent);
