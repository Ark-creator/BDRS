import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Footer from '@/Components/Residents/Footer';
import { motion } from 'framer-motion';

// Helper component for icons to keep the main code clean
const Icon = ({ path, className = "h-7 w-7" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

// Animation variants for sections
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

export default function AboutUs({ auth }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="About Us | Brgy. San Lorenzo" />
            
            <div className="bg-slate-50 text-slate-800">
                <main>

                    <div className="relative overflow-hidden bg-sky-50">
                        <div className="max-w-7xl mx-auto py-20 sm:py-28 px-6 lg:px-8">
                            <div className="grid lg:grid-cols-2 gap-x-12 gap-y-10 items-center">
                                <motion.div 
                                    className="relative z-10"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                >
                                    <p className="text-base font-semibold text-blue-600 tracking-wide uppercase">About Us</p>
                                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl text-balance">
                                        Empowering Our Community Through Digital Innovation
                                    </h1>
                                    <p className="mt-6 text-lg text-slate-600 leading-8 text-balance">
                                        We are a digital platform designed to make accessing local government services and documents faster, more transparent, and easier for you.
                                    </p>
                                </motion.div>
                                <motion.div 
                                    className="relative h-80 lg:h-full w-full rounded-3xl shadow-2xl overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                >
                                    <img 
                                        src="/images/brgy.png" 
                                        alt="Government Service"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                    
                    <motion.div 
                        className="py-20 sm:py-28"
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
                                <motion.div variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 text-blue-600">
                                        <Icon path="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
                                    <p className="mt-2 text-slate-600 text-balance">A modern and inclusive local government where services are delivered with integrity, innovation, and a tangible impact on the lives of our citizens.</p>
                                </motion.div>
                                <motion.div variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 text-blue-600">
                                         <Icon path="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
                                    <p className="mt-2 text-slate-600 text-balance">To bridge the gap between the government and the community by providing a centralized, user-friendly digital platform for all essential services.</p>
                                </motion.div>
                                <motion.div variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 text-blue-600">
                                        <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Our Goal</h3>
                                    <p className="mt-2 text-slate-600 text-balance">To provide fast, transparent, and accessible services to every citizen, utilizing digital solutions to make document processing simple and efficient.</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="py-20 sm:py-28 bg-white"
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Our Commitment to Transparency</h2>
                                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 text-balance">
                                    Building trust through open governance and accessible information.
                                </p>
                            </div>
                            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <motion.div className="bg-slate-50 p-8 rounded-2xl ring-1 ring-slate-200" variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600">
                                        <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Public Records Access</h3>
                                    <p className="mt-2 text-slate-600">Access to public documents and records is made simple through our portal.</p>
                                </motion.div>
                                <motion.div className="bg-slate-50 p-8 rounded-2xl ring-1 ring-slate-200" variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600">
                                        <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Financial Reports</h3>
                                    <p className="mt-2 text-slate-600">View and download barangay financial statements and budget reports.</p>
                                </motion.div>
                                <motion.div className="bg-slate-50 p-8 rounded-2xl ring-1 ring-slate-200" variants={cardVariants}>
                                    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600">
                                        <Icon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Community Feedback</h3>
                                    <p className="mt-2 text-slate-600">We provide channels for residents to voice concerns and suggestions.</p>
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
                            <h2 className="text-3xl font-bold text-center text-slate-900 sm:text-4xl mb-16">Meet Our Officials</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <motion.div className="text-center group" variants={cardVariants}>
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/mayorjoy.jpg" alt="City Mayor" />
                                    <h3 className="text-xl font-bold text-slate-900">Hon. Joy Pascual</h3>
                                    <p className="text-blue-600 font-semibold">City Mayor</p>
                                </motion.div>
                                <motion.div className="text-center group" variants={cardVariants}>
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/amparado.png" alt="City Councilor" />
                                    <h3 className="text-xl font-bold text-slate-900">Paul Michael Amparado</h3>
                                    <p className="text-blue-600 font-semibold">Barangay Captain</p>
                                </motion.div>
                                <motion.div className="text-center group" variants={cardVariants}>
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105" src="/images/sec.jpg" alt="Barangay Secretary" />
                                    <h3 className="text-xl font-bold text-slate-900">William Tirrado</h3>
                                    <p className="text-blue-600 font-semibold">Barangay Secretary</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        className="py-20 sm:py-28 bg-slate-100"
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                    >
                        <div className="max-w-4xl mx-auto px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center text-slate-900 sm:text-4xl mb-20">Our Journey</h2>
                            <div className="relative border-l-2 border-blue-200">
                                <motion.div className="mb-16 ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                    <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white">
                                        <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" className="w-5 h-5 text-white" />
                                    </span>
                                    <div className="bg-white p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                        <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                            Conceptualization <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">December 2024</span>
                                        </h3>
                                        <p className="text-base text-slate-500">The idea was born and the core objectives of the system were outlined by the team.</p>
                                    </div>
                                </motion.div>
                                <motion.div className="mb-16 ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                    <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white">
                                        <Icon path="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" className="w-5 h-5 text-white" />
                                    </span>
                                    <div className="bg-white p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                        <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                            Alpha & Beta Testing <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">August 2025</span>
                                        </h3>
                                        <p className="text-base text-slate-500">We released a beta version to a select group to gather feedback and improve the platform.</p>
                                    </div>
                                </motion.div>
                                <motion.div className="ml-10" variants={timelineItemVariants} whileInView="visible" viewport={{ once: true }}>
                                    <span className="absolute flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full -left-5 ring-8 ring-white">
                                        <Icon path="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-9 9a9 9 0 019-9" className="w-5 h-5 text-white" />
                                    </span>
                                    <div className="bg-white p-6 rounded-lg shadow-md ring-1 ring-slate-900/5">
                                        <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                            Future Development <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">Future</span>
                                        </h3>
                                        <p className="text-base text-slate-500">We are committed to adding new features and integrating with other local government units.</p>
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
