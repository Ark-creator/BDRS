import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MegaphoneOff, ArrowRight, ExternalLink, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

const AnnouncementPopover = ({ announcement, onClose }) => {
    const contentRef = useRef(null);
    const [isScrollable, setIsScrollable] = useState(false);

    useEffect(() => {
        const contentElement = contentRef.current;
        if (contentElement) {
            setIsScrollable(contentElement.scrollHeight > contentElement.clientHeight);
        }
    }, [announcement]);

    if (!announcement) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 sm:p-10 ring-1 ring-slate-900/5 flex flex-col"
                >
                    <div className="flex-shrink-0">
                        <p className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{announcement.tag}</p>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {announcement.title}
                        </h2>
                    </div>
                    
                    <div className="relative mt-4 flex-grow min-h-0">
                         <p ref={contentRef} className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-line pr-2">
                            {announcement.description}
                        </p>
                        {isScrollable && (
                             <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none" />
                        )}
                    </div>
                    
                    <div className="mt-6 flex-shrink-0">
                        {announcement.link && (
                            <a
                                href={announcement.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors text-sm"
                            >
                                <span>Visit Link for More Info</span>
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};


export default function Announcements({ announcements }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    if (!announcements || announcements.length === 0) {
        return (
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5 min-h-[480px] flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col lg:flex-row opacity-60 dark:opacity-40">
                    <div className="lg:w-[45%] h-64 lg:h-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                        <ImageIcon className="w-20 h-20 text-slate-300 dark:text-slate-600" strokeWidth={1} />
                    </div>
                    <div className="lg:w-[55%] p-8 sm:p-12 flex flex-col justify-center animate-pulse">
                        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                        <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                        <div className="w-1/2 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2.5"></div>
                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2.5"></div>
                        <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                </div>
                
                <div className="relative z-10 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                    <MegaphoneOff className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" strokeWidth={1.5} />
                    <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">No New Announcements</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">It's all quiet for now. Please check back later!</p>
                </div>
            </div>
        );
    }
    
    useEffect(() => {
        announcements.forEach(announcement => {
            const img = new Image();
            img.src = announcement.image_url; 
        });
    }, [announcements]);

    useEffect(() => {
        if (!isPaused && !selectedAnnouncement) {
            const timer = setTimeout(() => goToNext(), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, isPaused, selectedAnnouncement]);
    
    const goToNext = () => {
        const isLastSlide = currentIndex === announcements.length - 1;
        setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
    };

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        setCurrentIndex(isFirstSlide ? announcements.length - 1 : currentIndex - 1);
    };

    const currentAnnouncement = announcements[currentIndex];
    const shouldShowReadMore = currentAnnouncement.link || currentAnnouncement.description.length > 150;
    
    return (
        <>
            <AnnouncementPopover announcement={selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
            <div 
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="relative min-h-[480px] w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            variants={{ 
                                hidden: { opacity: 0 }, 
                                visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } }, 
                                exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } } 
                            }}
                            initial="hidden" animate="visible" exit="exit"
                            className="absolute inset-0 flex flex-col lg:flex-row"
                        >
                            <div className="lg:w-[45%] h-64 lg:h-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                <div
                                    className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-105"
                                    style={{ backgroundImage: `url(${currentAnnouncement.image_url})` }}
                                />
                            </div>
                            
                            <div className="lg:w-[55%] p-8 sm:p-12 flex flex-col justify-center">
                                <p className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{currentAnnouncement.tag}</p>
                                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    {currentAnnouncement.title}
                                </h2>
                                <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                                    {currentAnnouncement.description}
                                </p>
                                <div className="mt-8">
                                    {shouldShowReadMore && (
                                        <button 
                                            onClick={() => setSelectedAnnouncement(currentAnnouncement)}
                                            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            Read More <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                <button onClick={goToPrevious} className="absolute top-1/2 left-3 transform -translate-y-1/2 z-10 bg-white/50 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-700 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100" aria-label="Previous">
                    <ChevronLeft className="w-6 h-6 text-slate-800 dark:text-white"/>
                </button>
                <button onClick={goToNext} className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 bg-white/50 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-700 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100" aria-label="Next">
                    <ChevronRight className="w-6 h-6 text-slate-800 dark:text-white"/>
                </button>
                <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
                    {announcements.map((_, slideIndex) => (
                        <button
                            key={slideIndex}
                            onClick={() => setCurrentIndex(slideIndex)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-blue-600 scale-125' : 'bg-slate-300/80 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-400'}`}
                            aria-label={`Go to slide ${slideIndex + 1}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}