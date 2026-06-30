import React from 'react';
import { Card } from './Card';

function SkeletonCardComponent({ className = '' }: { className?: string }) {
    return (
        <Card className={`bg-white/5 ${className}`}>
          <div className="flex flex-col justify-between h-full">
            <div className="h-5 bg-gray-600/50 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-500/50 rounded w-3/4 mx-auto"></div>
          </div>
        </Card>
    );
}

export const SkeletonCard = React.memo(SkeletonCardComponent);