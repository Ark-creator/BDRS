// resources/js/Components/Residents/TranslateButton.jsx
import React from 'react';
import clsx from 'clsx';

const FlagPH = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className={className}>
        <rect fill="#0038A8" width="9" height="3" />
        <rect fill="#CE1126" y="3" width="9" height="3" />
        <path fill="#fff" d="M0 0v6l4.5-3z"/>
        <path fill="#fcd116" d="M2.57 3.3a.7.7 0 100-1 .7.7 0 000 .9zM2.12 3l.23-1 .24 1-.47-1 .36.8L2 2.6l.47.63-.36-.83z"/>
    </svg>
);

const FlagUSA = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48" className={className}>
        <path fill="#B31942" d="M0 0h72v48H0z"/>
        <path fill="#fff" d="M0 4h72v4H0zm0 8h72v4H0zm0 8h72v4H0zm0 8h72v4H0zm0 8h72v4H0zm0 8h72v4H0z"/>
        <path fill="#0A3161" d="M0 0h36v28H0z"/>
        <path fill="#fff" d="m6 4 1.3 4L11 4l-2.6 3 1.3 4-3.2-2L4 11l1.3-4-2.6-3zm12 0 1.3 4L23 4l-2.6 3 1.3 4-3.2-2-2.5 2 1.3-4-2.6-3zm12 0 1.3 4L35 4l-2.6 3 1.3 4-3.2-2-2.5 2 1.3-4-2.6-3zM6 14l1.3 4L11 14l-2.6 3 1.3 4-3.2-2L4 21l1.3-4-2.6-3zm12 0 1.3 4L23 14l-2.6 3 1.3 4-3.2-2-2.5 2 1.3-4-2.6-3zm12 0 1.3 4L35 14l-2.6 3 1.3 4-3.2-2-2.5 2 1.3-4-2.6-3z"/>
    </svg>
);

export default function TranslateButton({ language, setLanguage, isMobile = false }) {
    // Mobile view has a slightly different container and button styling
    if (isMobile) {
        return (
            <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 flex text-sm font-semibold">
                <button onClick={() => setLanguage('en')} className={clsx('w-full px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-2', language === 'en' ? 'bg-white text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300')}>
                    <FlagUSA className="h-4 w-5 rounded-sm" /> EN
                </button>
                <button onClick={() => setLanguage('tg')} className={clsx('w-full px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-2', language === 'tg' ? 'bg-white text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300')}>
                    <FlagPH className="h-4 w-5 rounded-sm" /> TG
                </button>
            </div>
        );
    }
    
    // Desktop view
    return (
        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 flex text-sm font-semibold">
            <button onClick={() => setLanguage('en')} className={clsx('px-3 py-1 rounded-full transition-colors flex items-center gap-2', language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400')}>
                <FlagUSA className="h-4 w-5 rounded-sm" /> EN
            </button>
            <button onClick={() => setLanguage('tg')} className={clsx('px-3 py-1 rounded-full transition-colors flex items-center gap-2', language === 'tg' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400')}>
                <FlagPH className="h-4 w-5 rounded-sm" /> TG
            </button>
        </div>
    );
}