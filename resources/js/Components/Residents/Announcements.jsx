import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

const announcementsData = [
    {
        tag: 'Community Event',
        title: 'San Lorenzo Fiesta 2025 Highlights',
        description: 'Join us for the culminating night of the San Lorenzo Fiesta on August 15, 2025, at the Brgy. San Lorenzo Plaza. Enjoy live music, performances, and a grand fireworks display.',
        image: '/images/ex5.png',
        alt: 'Fiesta celebration with live band and crowd',
        link: '/events/san-lorenzo-fiesta-2025'
    },
    {
        tag: 'Education Program',
        title: 'Free School Supplies for Elementary Students',
        description: 'In line with the back-to-school program, the Local Government will distribute free bags and school supplies. Distribution is on August 20, 2025, at the Gapan City Gymnasium.',
        image: '/images/ex4.png',
        alt: 'School bags and supplies ready for distribution',
        link: '/education/free-school-supplies-2025'
    },
    {
        tag: 'Public Works Advisory',
        title: 'Drainage System Improvement Project',
        description: 'A drainage improvement project will commence along Tinio Street starting September 1, 2025. Motorists are advised to expect minor traffic disruptions in the area.',
        image: '/images/ex3.png',
        alt: 'Roadside drainage construction work',
        link: '/announcements/drainage-project-sept-2025'
    },
    {
        tag: 'Environmental Initiative',
        title: 'Brgy. San Lorenzo Cleanup Drive',
        description: 'Residents of Barangay San Lorenzo are invited to a community cleanup drive this Saturday, August 23, 2025. Assembly is at 6:00 AM at the San Lorenzo Barangay Hall.',
        image: '/images/ex2.png',
        alt: 'Community volunteers with trash bags during a cleanup drive.',
        link: '/announcements/cleanup-drive-aug-2025'
    },

    {
        tag: 'Health Advisory',
        title: 'Intensified Dengue Prevention Campaign',
        description: 'As cases rise this rainy season, let\'s practice the 5S Strategy against Dengue: Search & Destroy, Self-protection, Seek early consultation, Support fogging, and Sustain hydration.',
        image: '/images/ex6.png',
        alt: 'Healthcare professional providing health advisory.',
        link: '/health/dengue-prevention-2025'
    }];
const slideVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }
};

export default function Announcements() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        announcementsData.forEach(announcement => {
            const img = new Image();
            img.src = announcement.image;
        });
    }, []);

    useEffect(() => {
        if (!isPaused) {
            const timer = setTimeout(() => {
                goToNext();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, isPaused]);
    
    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? announcementsData.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === announcementsData.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex);
    };

    return (
        <div 
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative min-h-[480px] w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        variants={slideVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute inset-0 flex flex-col lg:flex-row"
                    >
 
                        <div className="lg:w-[40%] h-64 lg:h-full bg-slate-100 overflow-hidden">
                            <div
                                className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-105"
                                style={{ backgroundImage: `url(${announcementsData[currentIndex].image})` }}
                            />
                        </div>
                        
                        <div className="lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center">
                            <p className="font-semibold text-blue-600 uppercase tracking-wider">{announcementsData[currentIndex].tag}</p>
    
                            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                                {announcementsData[currentIndex].title}
                            </h2>
                            <p className="mt-4 text-base text-slate-600 leading-relaxed">
                                {announcementsData[currentIndex].description}
                            </p>
                            <div className="mt-8">
                                <Link 
                                    href={announcementsData[currentIndex].link}
                                    className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
                                >
                                    Read More
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <button 
                onClick={goToPrevious}
                className="absolute top-1/2 left-3 transform -translate-y-1/2 z-10 bg-white/60 hover:bg-white rounded-full p-2 shadow-md transition-all"
                aria-label="Previous"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-800"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <button 
                onClick={goToNext}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 bg-white/60 hover:bg-white rounded-full p-2 shadow-md transition-all"
                aria-label="Next"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-800"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            
            <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
                {announcementsData.map((_, slideIndex) => (
                    <button
                        key={slideIndex}
                        onClick={() => goToSlide(slideIndex)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-white'}`}
                        aria-label={`Go to slide ${slideIndex + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}