import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Component para sa Popover (Modal)
const AnnouncementPopover = ({ announcement, onClose }) => {
    // Kung walang announcement, huwag i-render ang popover
    if (!announcement) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()} // Pigilan ang pag-close kapag na-click ang mismong card
                    className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 sm:p-12 ring-1 ring-slate-900/5"
                >
                    <p className="font-semibold text-blue-600 uppercase tracking-wider">{announcement.tag}</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                        {announcement.title}
                    </h2>
                    {/* Ito na ang may paragraph formatting */}
                    <p className="mt-4 text-base text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-line">
                        {announcement.description}
                    </p>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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

    // Character limit para sa description bago ito putulin
    const DESCRIPTION_LIMIT = 150;

    if (!announcements || announcements.length === 0) {
        return (
            <div className="relative bg-white rounded-2xl shadow-2xl p-12 text-center ring-1 ring-slate-900/5">
                <h2 className="text-2xl font-bold text-slate-700">No Announcements Yet</h2>
                <p className="mt-2 text-slate-500">Please check back later for new updates and events.</p>
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
        // I-pause din kapag may naka-open na popover
        if (!isPaused && !selectedAnnouncement) {
            const timer = setTimeout(() => {
                goToNext();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, isPaused, announcements, selectedAnnouncement]);
    
    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? announcements.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === announcements.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    const handleReadMoreClick = (announcement) => {
        setSelectedAnnouncement(announcement);
    };

    const handleClosePopover = () => {
        setSelectedAnnouncement(null);
    };

    const currentAnnouncement = announcements[currentIndex];
    const isDescriptionTruncated = currentAnnouncement.description.length > DESCRIPTION_LIMIT;
    
    return (
        <>
            <AnnouncementPopover announcement={selectedAnnouncement} onClose={handleClosePopover} />
            <div 
                className="relative bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="relative min-h-[480px] w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            variants={{ 
                                hidden: { opacity: 0 }, 
                                visible: { opacity: 1, transition: { duration: 0.6 } }, 
                                exit: { opacity: 0, transition: { duration: 0.6 } } 
                            }}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute inset-0 flex flex-col lg:flex-row"
                        >
                            <div className="lg:w-[40%] h-64 lg:h-full bg-slate-100 overflow-hidden">
                                <div
                                    className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-105"
                                    style={{ backgroundImage: `url(${currentAnnouncement.image_url})` }}
                                />
                            </div>
                            
                            <div className="lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center">
                                <p className="font-semibold text-blue-600 uppercase tracking-wider">{currentAnnouncement.tag}</p>
                                <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                                    {currentAnnouncement.title}
                                </h2>
                                <p className="mt-4 text-base text-slate-600 leading-relaxed line-clamp-4">
                                    {currentAnnouncement.description}
                                </p>
                                <div className="mt-8">
                                    {isDescriptionTruncated && (
                                        <button 
                                            onClick={() => handleReadMoreClick(currentAnnouncement)}
                                            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
                                        >
                                            Read More
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                {/* Navigation Buttons and Dots */}
                <button onClick={goToPrevious} className="absolute top-1/2 left-3 transform -translate-y-1/2 z-10 bg-white/60 hover:bg-white rounded-full p-2 shadow-md transition-all" aria-label="Previous">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-800"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                <button onClick={goToNext} className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 bg-white/60 hover:bg-white rounded-full p-2 shadow-md transition-all" aria-label="Next">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-800"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
                    {announcements.map((_, slideIndex) => (
                        <button
                            key={slideIndex}
                            onClick={() => goToSlide(slideIndex)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-white'}`}
                            aria-label={`Go to slide ${slideIndex + 1}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}