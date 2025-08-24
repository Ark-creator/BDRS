import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Linkedin, Eye, Target, CheckCircle, ShieldCheck, MessageCircle, Smartphone, Rocket, Calendar, Code } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Footer from '@/Components/Residents/Footer';

const FeatureIcon = ({ icon: IconComponent }) => (
    <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
        <IconComponent className="h-8 w-8" />
    </div>
);

const AuroraBackground = () => (
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
            className="absolute top-[10%] -left-[5%] w-[40rem] h-[40rem] bg-gradient-to-tr from-sky-50 to-sky-50 rounded-full blur-3xl"
            animate={{ x: [-20, 20, -20], y: [-20, 20, -20], rotate: [0, 5, 0], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
    </div>
);

const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } }
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const timelineItemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};


export default function AboutUs({ auth = { user: { name: 'Guest' } } }) {

    return (
        <AuthenticatedLayout>
        <div className="bg-sky-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <main>
                <div className="relative overflow-hidden isolate">
                    <AuroraBackground />
                    <div className="max-w-7xl mx-auto py-24 sm:py-32 px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-10 items-center">
                            <motion.div 
                                className="relative z-10"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <p className="text-base font-semibold text-blue-600 dark:text-blue-400 tracking-wide uppercase">About Us</p>
                               <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl text-balance bg-gradient-to-r from-sky-500 via-sky-300 via-sky-350 to-sky-400 bg-clip-text text-transparent bg-[size:200%_auto] animate-gradient">
                                    Empowering Our Community Through Digital Innovation
                                </h1>
                                <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-8 text-balance">
                                    We are a digital platform designed to make accessing local government services and documents faster, more transparent, and easier for you.
                                </p>
                            </motion.div>
                            <motion.div className="w-full mt-10 md:mt-0" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <video src="/images/solid.mp4" className="w-full h-auto rounded-xl" autoPlay loop muted playsInline>
                                    Your browser does not support the video tag.
                                </video>
                            </motion.div>
                        </div>
                    </div>
                </div>
                
                <motion.div 
                    className="py-20 sm:py-28 "
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 " id="GOALS">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center ">
                            <motion.div variants={cardVariants} className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl shadow-lg backdrop-blur-lg ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                                <FeatureIcon icon={Eye} />
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300 text-balance">A modern and inclusive local government where services are delivered with integrity, innovation, and a tangible impact on the lives of our citizens.</p>
                            </motion.div>
                            <motion.div variants={cardVariants} className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl shadow-lg backdrop-blur-lg ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                                <FeatureIcon icon={Target} />
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300 text-balance">To bridge the gap between the government and the community by providing a centralized, user-friendly digital platform for all essential services.</p>
                            </motion.div>
                            <motion.div variants={cardVariants} className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl shadow-lg backdrop-blur-lg ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                                <FeatureIcon icon={CheckCircle} />
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Goal</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300 text-balance">To provide fast, transparent, and accessible services to every citizen, utilizing digital solutions to make document processing simple and efficient.</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    className="py-20 sm:py-28 bg-white dark:bg-slate-800"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Our Commitment to Transparency</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400 text-balance">
                                Building trust through open governance and accessible information.
                            </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700" variants={cardVariants}>
                                <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transparency</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300">Promoting honesty with no fees for essential documents, except for barangay business clearances.</p>
                            </motion.div>
                            <motion.div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700" variants={cardVariants}>
                                <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                                    <MessageCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Community Feedback</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300">A built-in system allows residents to voice concerns and suggestions directly to barangay officials.</p>
                            </motion.div>
                            <motion.div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700" variants={cardVariants}>
                                <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Easy Access</h3>
                                <p className="mt-2 text-slate-600 dark:text-slate-300">Request documents anytime, anywhere. Our system is accessible on desktops, tablets, and mobile phones.</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    className="py-20 sm:py-28"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white sm:text-4xl mb-16">Meet Our Officials</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <motion.div className="text-center group" variants={cardVariants}>
                                <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white dark:ring-slate-700 shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/mayorjoy.png" alt="City Mayor" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hon. Joy Pascual</h3>
                                <p className="text-blue-600 dark:text-blue-400 font-semibold">Gapan City Mayor</p>
                            </motion.div>
                            <motion.div className="text-center group" variants={cardVariants}>
                                <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white dark:ring-slate-700 shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/congemeng.png" alt="Barangay Captain" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hon. Emeng Pascual</h3>
                                <p className="text-blue-600 dark:text-blue-400 font-semibold">Nueva Ecija 4th <br />District Congressman</p>
                            </motion.div>
                            <motion.div className="text-center group" variants={cardVariants}>
                                <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white dark:ring-slate-700 shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/max.png" alt="Barangay Secretary" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hon. Max Pascual</h3>
                                <p className="text-blue-600 dark:text-blue-400 font-semibold">Gapan City Vice Mayor</p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="py-20 sm:py-28 bg-slate-100 dark:bg-slate-800/50"
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <div className="max-w-4xl mx-auto px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white sm:text-4xl mb-20">Our Journey</h2>
                        <div className="relative border-l-2 border-blue-200 dark:border-blue-800">
                            <motion.div className="mb-16 ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white dark:ring-slate-800/50">
                                    <Calendar className="w-5 h-5 text-white" />
                                </span>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                                        Conceptualization <span className="text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">December 2024</span>
                                    </h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400">The idea was born and the core objectives of the system were outlined by the team.</p>
                                </div>
                            </motion.div>
                            <motion.div className="mb-16 ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white dark:ring-slate-800/50">
                                    <Code className="w-5 h-5 text-white" />
                                </span>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                                        Alpha & Beta Testing <span className="text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">August 2025</span>
                                    </h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400">We released a beta version to a select group to gather feedback and improve the platform.</p>
                                </div>
                            </motion.div>
                            <motion.div className="ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white dark:ring-slate-800/50">
                                    <Rocket className="w-5 h-5 text-white" />
                                </span>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                    <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                                        Future Development <span className="text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">Future</span>
                                    </h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400">We are committed to adding new features and integrating with other local government units.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
        </AuthenticatedLayout>
    );
}
