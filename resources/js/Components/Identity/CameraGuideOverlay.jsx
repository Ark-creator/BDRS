import React from 'react';

const guideConfig = {
    face: {
        label: 'Align your face inside the frame',
        aspectRatio: '1 / 1',
        width: 'min(70%, 320px)',
        height: 'min(70%, 320px)',
        radius: '9999px',
    },
    id: {
        label: 'Position the ID within the frame',
        aspectRatio: '1.58 / 1',
        width: 'min(84%, 520px)',
        height: 'auto',
        radius: '16px',
    },
};

export default function CameraGuideOverlay({ target = 'id' }) {
    const config = guideConfig[target] || guideConfig.id;

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
                className="relative flex items-center justify-center border-2 border-white/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] transition-all duration-300 ease-out animate-pulse"
                style={{
                    width: config.width,
                    height: config.height,
                    aspectRatio: config.aspectRatio,
                    borderRadius: config.radius,
                }}
            >
                <div className="absolute inset-0 border border-white/30" style={{ borderRadius: config.radius }} />
                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
                <div className="absolute left-1/2 top-1/2 h-0.5 w-10 -translate-x-1/2 bg-white/70" />
                <div className="absolute left-1/2 top-1/2 h-10 w-0.5 -translate-y-1/2 bg-white/70" />
            </div>
            <div className="absolute bottom-6 left-1/2 w-full -translate-x-1/2 px-6 text-center text-xs font-medium text-white drop-shadow">
                {config.label}
            </div>
        </div>
    );
}
