import React from 'react';

const GuideFrame = ({ isFace }) => {
    const frameSize = isFace
        ? 'w-[58%] max-w-[320px] aspect-[3/4] rounded-full'
        : 'w-[78%] max-w-[520px] aspect-[1.55] rounded-2xl';

    return (
        <div className={`relative ${frameSize} border border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.25)]`}>
            <div className="absolute inset-0 rounded-[inherit] border-2 border-white/50 animate-pulse"></div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/70"></div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70"></div>
        </div>
    );
};

const InstructionText = ({ isFace }) => (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-4 py-2 text-xs font-medium text-white shadow-lg">
        {isFace ? 'Center your face inside the guide' : 'Align the full ID inside the frame'}
    </div>
);

const CameraOverlay = ({ target }) => {
    if (!target) return null;
    const isFace = target === 'face' || target === 'selfie';

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <GuideFrame isFace={isFace} />
            <InstructionText isFace={isFace} />
        </div>
    );
};

export default CameraOverlay;
