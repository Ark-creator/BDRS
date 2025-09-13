// File: resources/js/Components/TranslateButton.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';

export default function TranslateButton({ language, setLanguage }) {

    const handleToggle = () => {
        setLanguage(language === 'en' ? 'tg' : 'en');
    };

    // Animation settings for the text sliding effect
    const textVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -15 },
    };

    return (
        <button
            onClick={handleToggle}
            className="relative flex items-center justify-center w-32 h-10 gap-2 overflow-hidden rounded-lg bg-sky-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Switch language to ${language === 'en' ? 'Tagalog' : 'English'}`}
        >
            <Languages size={18} className="text-slate-500 dark:text-slate-400 shrink-0" />
            
            <div className="relative flex items-center justify-center w-16 h-6">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={language}
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="absolute text-sm font-semibold"
                    >
                        {language === 'en' ? 'English' : 'Tagalog'}
                    </motion.span>
                </AnimatePresence>
            </div>
        </button>
    );
}