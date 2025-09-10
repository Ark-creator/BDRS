import React from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1,
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

const OfficialCardSkeleton = () => (
    <div className="relative overflow-hidden p-8 bg-sky-50 dark:bg-slate-800 rounded-2xl shadow-xl animate-pulse">
    
        <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-56 h-56 bg-slate-100 dark:bg-slate-700/40 rounded-full"></div>
       
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-40 h-40 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <div className="w-full my-6 h-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-full flex flex-col items-center space-y-2">
                <div className="h-6 w-3/4 bg-slate-300 dark:bg-slate-700 rounded-md"></div>
                <div className="h-4 w-1/2 bg-slate-300 dark:bg-slate-700 rounded-md"></div>
            </div>
        </div>
    </div>
);



const OfficialsWelcome = ({ officials }) => {
    const isLoading = typeof officials === 'undefined';

    if (!isLoading && (!officials || officials.length === 0)) {
        return null;
    }

    return (
        <section id="officials" className="py-20 sm:py-28 bg-slate-100 dark:bg-slate-900">
            <motion.div
                className="max-w-7xl mx-auto px-6 lg:px-8"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Meet Our Officials
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
                        The dedicated public servants leading our community forward.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        [...Array(3)].map((_, index) => <OfficialCardSkeleton key={index} />)
                    ) : (
                        officials.map((official, index) => (
                            <motion.div
                                key={index}
                                className="relative overflow-hidden text-center bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10"
                                variants={cardVariants}
                            >
                            
                                <div className="relative p-8 flex flex-col items-center">
                                    <img
                                        className="w-40 h-40 rounded-full object-cover shadow-lg"
                                        src={official.photo_url || '/images/avatar-male.png'}
                                        alt={official.name || 'Official Photo'}
                                    />
                         
                                    <hr className="w-1/2 my-6 border-slate-200 dark:border-slate-700" />
                                    
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                            {official.name || 'Official Name'}
                                        </h3>
                                        <div
                                            className="mt-1 text-sm text-blue-600 dark:text-blue-500 font-medium"
                                            dangerouslySetInnerHTML={{ __html: official.position || 'Position' }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </section>
    );
};

export default OfficialsWelcome;