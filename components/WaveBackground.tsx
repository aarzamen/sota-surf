import React, { useMemo } from 'react';

interface WaveBackgroundProps {
  waveHeight: number;
  wavePeriod: number;
}

const WaveBackgroundComponent: React.FC<WaveBackgroundProps> = ({ waveHeight, wavePeriod }) => {
  const wavePath = useMemo(() => {
    // Normalize values to a visual range
    const amplitude = Math.min(Math.max(waveHeight * 10, 5), 40); // Clamp amplitude for visual stability
    const frequency = Math.min(Math.max(1 / (wavePeriod || 1) * 5, 0.5), 1.5); // Invert period to get frequency, avoid division by zero

    const width = 200;
    const height = 100;
    const yOffset = height / 1.5;

    let path = `M 0,${yOffset}`;

    const segments = 4;
    for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * width;
        // Use a sine wave for the path
        const y = yOffset - Math.sin((i/segments) * Math.PI * 2 * frequency) * amplitude;
        path += ` L ${x.toFixed(2)},${y.toFixed(2)}`;
    }
    path += ` L ${width},${height} L 0,${height} Z`;

    return path;
  }, [waveHeight, wavePeriod]);

  return (
    <div className="absolute inset-x-0 top-0 h-48 overflow-hidden -z-10 pointer-events-none" aria-hidden="true">
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] max-w-none"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <path
          d={wavePath}
          className="text-ocean-shallows fill-current opacity-50"
          style={{ transition: 'd 0.5s ease-in-out' }}
        />
        <path
          d={wavePath}
          transform="translate(5, 5)"
          className="text-ocean-shallows fill-current opacity-30"
          style={{ transition: 'd 0.5s ease-in-out', transitionDelay: '50ms' }}
        />
      </svg>
    </div>
  );
};

export const WaveBackground = React.memo(WaveBackgroundComponent);