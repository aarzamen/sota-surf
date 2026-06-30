
import React from 'react';

type UnitSystem = 'metric' | 'imperial';

interface UnitToggleProps {
    unitSystem: UnitSystem;
    onUnitSystemToggle: () => void;
    tempUnit: UnitSystem;
    onTempUnitToggle: () => void;
}

function UnitToggleComponent({ unitSystem, onUnitSystemToggle, tempUnit, onTempUnitToggle }: UnitToggleProps) {
    return (
        <div className="flex gap-3">
            {/* Distance Toggle */}
            <button onClick={onUnitSystemToggle} className="group flex flex-col items-center p-1">
                <span className="text-[8px] text-mil-tan uppercase mb-1 tracking-wider font-bold">Dist</span>
                <div className="w-12 h-6 bg-mil-black rounded-full relative border border-mil-tan/50 shadow-inner">
                    <div className={`absolute top-1 w-4 h-4 bg-mil-green rounded-full transition-all duration-200 shadow-[0_0_5px_#33ff33] ${unitSystem === 'metric' ? 'left-1' : 'left-7'}`}></div>
                </div>
            </button>

            {/* Temp Toggle */}
            <button onClick={onTempUnitToggle} className="group flex flex-col items-center p-1">
                <span className="text-[8px] text-mil-tan uppercase mb-1 tracking-wider font-bold">Temp</span>
                 <div className="w-12 h-6 bg-mil-black rounded-full relative border border-mil-tan/50 shadow-inner">
                    <div className={`absolute top-1 w-4 h-4 bg-mil-green rounded-full transition-all duration-200 shadow-[0_0_5px_#33ff33] ${tempUnit === 'metric' ? 'left-1' : 'left-7'}`}></div>
                </div>
            </button>
        </div>
    );
}

export const UnitToggle = React.memo(UnitToggleComponent);
