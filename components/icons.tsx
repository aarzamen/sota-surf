
import React from 'react';

export function CompassIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L12 6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18L12 21" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12L6 12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12L21 12" />
    </svg>
  );
}

export function WindArrowIcon({ className = 'w-6 h-6', rotation = 0 }: { className?: string, rotation?: number }) {
  return (
    <svg className={className} style={{ transform: `rotate(${rotation}deg)` }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L6 20h12L12 2z" />
    </svg>
  );
}

export function SwellArrowIcon({ className = 'w-6 h-6', rotation = 0 }: { className?: string, rotation?: number }) {
  return (
    <svg className={className} style={{ transform: `rotate(${rotation}deg)` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="m5 15 7 7 7-7" />
    </svg>
  );
}

export function WaveIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01M4 16h.01M8 16h.01M12 16h.01M16 16h.01M20 16h.01M4 8h.01M8 8h.01M12 8h.01" />
    </svg>
  );
}

export function ClockIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function TideIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function InfoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function BrainIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function BackIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ThermometerIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  );
}

export function PrecipitationIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10a4 4 0 10-6.815-2.246A5 5 0 006 15h12a4 4 0 000-8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v3m-4-3v3m8-3v3" />
    </svg>
  );
}

export function ShareIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
     <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
     </svg>
  );
}
