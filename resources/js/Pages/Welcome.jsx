import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { FileText, Megaphone, Users, ArrowRight, UserPlus, MousePointerClick, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Footer from '@/Components/Residents/Footer';

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

// Content object for EN/TG translation
const content = {
    en: {
        title: "Doconnect",
        tagline: "Fast and Reliable Service",
        heroTitle: "Your Barangay Services, Now Online",
        heroSubtitle: "Easily request documents, stay updated with announcements, and connect with your barangay officials—all in one place.",
        getStarted: "Get Started",
        login: "Log In",
        register: "Register",
        dashboard: "Dashboard",
        howItWorksTitle: "How It Works",
        howItWorksSubtitle: "Get your documents in three simple steps.",
        step1Title: "1. Register an Account",
        step1Desc: "Create your secure account using the required information.",
        step2Title: "2. Select & Request",
        step2Desc: "Choose the document you need and fill out the necessary forms online.",
        step3Title: "3. Claim Your Document",
        step3Desc: "Wait for a notification from the barangay on when to claim your document.",
        servicesTitle: "Our Services",
        servicesSubtitle: "Everything you need, all on one platform.",
        service1Title: "Document Requests",
        service1Desc: "Process various official documents such as: Barangay Clearance, Indigency, Business Clearance, Certificate of Residency, and more.",
        service2Title: "Latest Announcements",
        service2Desc: "Stay informed with the latest news, events, and important announcements from your local barangay officials.",
        service3Title: "Resident Profile",
        service3Desc: "Securely manage your personal information and view your complete transaction history with the barangay.",
    },
    tg: {
        title: "Doconnect",
        tagline: "Serbisyong Mabilis at Maasahan",
        heroTitle: "Serbisyo ng Iyong Barangay, Online Na",
        heroSubtitle: "Madaling kumuha ng dokumento, manatiling updated sa mga anunsyo, at kumonekta sa mga opisyal ng barangay—lahat sa isang lugar.",
        getStarted: "Magsimula",
        login: "Mag-login",
        register: "Mag-rehistro",
        dashboard: "Dashboard",
        howItWorksTitle: "Paano Ito Gumagana?",
        howItWorksSubtitle: "Kunin ang iyong dokumento sa tatlong simpleng hakbang.",
        step1Title: "1. Mag-rehistro",
        step1Desc: "Gumawa ng iyong secure na account gamit ang mga kinakailangang impormasyon.",
        step2Title: "2. Pumili at Mag-request",
        step2Desc: "Piliin ang dokumentong kailangan mo at sagutan ang mga kinakailangang form online.",
        step3Title: "3. Kunin ang Dokumento",
        step3Desc: "Hintayin ang abiso mula sa barangay kung kailan ito maaaring kunin.",
        servicesTitle: "Mga Serbisyo Namin",
        servicesSubtitle: "Lahat ng kailangan mo, nasa isang platform lang.",
        service1Title: "Pag-request ng Dokumento",
        service1Desc: "Mag-proseso ng iba't ibang opisyal na dokumento tulad ng: Barangay Clearance, Indigency, Business Clearance, Certificate of Residency, at iba pa.",
        service2Title: "Mga Bagong Anunsyo",
        service2Desc: "Manatiling may alam sa mga pinakabagong balita, kaganapan, at mahahalagang anunsyo mula sa iyong mga lokal na opisyal.",
        service3Title: "Profile ng Residente",
        service3Desc: "Ligtas na pamahalaan ang iyong personal na impormasyon at tingnan ang kumpletong history ng iyong mga transaksyon sa barangay.",
    }
};

const ServiceCard = ({ icon, title, description }) => (
    <motion.div 
        className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl shadow-md backdrop-blur-sm ring-1 ring-black/5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
    >
        <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/50 p-3 rounded-full w-fit mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </motion.div>
);

const AuroraBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
            className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-gradient-to-tr from-sky-200 to-blue-500 rounded-full blur-3xl"
            animate={{ x: [-20, 20, -20], y: [-20, 20, -20], rotate: [0, 5, 0], opacity: [0.15, 0.25, 0.15] }}
            // Binabaan ang duration mula 30s to 20s para bumilis
            transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
        <motion.div 
            className="absolute top-[50%] left-[50%] w-[50rem] h-[50rem] bg-gradient-to-tr from-blue-300 to-sky-200 rounded-full blur-3xl"
            animate={{ x: [20, -20, 20], y: [20, -20, 20], rotate: [0, -5, 0], opacity: [0.1, 0.2, 0.1] }}
            // Binabaan ang duration mula 35s to 25s para bumilis
            transition={{ duration: 25, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
    </div>
);

export default function Welcome({ auth }) {
    const [scrolled, setScrolled] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const t = content[language];

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <>
            <Head title={t.title} />
            <div className="relative overflow-x-hidden bg-sky-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 isolate">
                <header className={clsx("fixed top-0 left-0 right-0 z-30 transition-all duration-300", scrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md" : "bg-transparent")}>
                    <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
                        <div className="flex lg:flex-1">
                            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                                <img className="h-10 w-auto rounded-full ring-2 ring-white/50" src="/images/gapanlogo.png" alt="Barangay Logo" />
                                <span className="font-bold text-lg text-slate-800 dark:text-white">Doconnect</span>
                            </Link>
                        </div>
                        <div className="flex flex-1 justify-end items-center gap-x-2 sm:gap-x-4">
                                <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 flex text-sm font-semibold">
                                    <button onClick={() => setLanguage('en')} className={clsx('px-3 py-1 rounded-full transition-colors flex items-center gap-2', language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400')}>
                                        <FlagUSA className="h-4 w-5 rounded-sm" /> EN
                                    </button>
                                    <button onClick={() => setLanguage('tg')} className={clsx('px-3 py-1 rounded-full transition-colors flex items-center gap-2', language === 'tg' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400')}>
                                        <FlagPH className="h-4 w-5 rounded-sm" /> TG
                                    </button>
                                </div>
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-md px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 transition hover:bg-slate-100 dark:hover:bg-slate-800">{t.dashboard}</Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="hidden sm:block rounded-md px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white">{t.login}</Link>
                                    <Link href={route('register')} className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-blue-600 transition-colors">{t.register}</Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main className="relative z-10">
                    <div className="min-h-screen flex items-center relative overflow-hidden">
                        <AuroraBackground />
                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 max-w-7xl mx-auto px-6 pt-24 pb-12 lg:py-0 z-10">
                            <motion.div className="text-center lg:text-left" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                                <motion.span variants={FADE_IN_VARIANTS} className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/50 px-3 py-1 text-sm font-medium text-sky-800 dark:text-sky-300">{t.tagline}</motion.span>
                                <motion.h1 variants={FADE_IN_VARIANTS} className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.heroTitle}</motion.h1>
                                <motion.p variants={FADE_IN_VARIANTS} className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">{t.heroSubtitle}</motion.p>
                                <motion.div variants={FADE_IN_VARIANTS} className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                                    <Link href={route('register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-blue-600 transition-transform hover:scale-105">
                                            {t.getStarted}
                                            <ArrowRight size={20} />
                                        </Link>
                                </motion.div>
                            </motion.div>
                            <motion.div className="hidden lg:block" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <video 
                                    src="/images/solid.mp4" 
                                    className="w-full h-auto rounded-xl" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                >
                                    {/* You can add a fallback message here for browsers that do not support the video tag. */}
                                    Your browser does not support the video tag.
                                </video>
                            </motion.div>
                        </div>
                    </div>

                    <section className="py-16 sm:py-24 bg-white dark:bg-slate-900/50">
                        <div className="max-w-7xl mx-auto px-6 text-center">
                            <motion.h2 initial="hidden" whileInView="visible" variants={FADE_IN_VARIANTS} viewport={{ once: true }} className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t.howItWorksTitle}</motion.h2>
                            <motion.p initial="hidden" whileInView="visible" variants={FADE_IN_VARIANTS} viewport={{ once: true }} className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t.howItWorksSubtitle}</motion.p>
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col items-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 ring-8 ring-sky-50 dark:ring-slate-800"><UserPlus className="h-8 w-8 text-sky-600 dark:text-sky-400" /></div>
                                    <h3 className="mt-5 text-lg font-semibold text-slate-800 dark:text-white">{t.step1Title}</h3>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.step1Desc}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 ring-8 ring-sky-50 dark:ring-slate-800"><MousePointerClick className="h-8 w-8 text-sky-600 dark:text-sky-400" /></div>
                                    <h3 className="mt-5 text-lg font-semibold text-slate-800 dark:text-white">{t.step2Title}</h3>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.step2Desc}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 ring-8 ring-sky-50 dark:ring-slate-800"><CheckCircle className="h-8 w-8 text-sky-600 dark:text-sky-400" /></div>
                                    <h3 className="mt-5 text-lg font-semibold text-slate-800 dark:text-white">{t.step3Title}</h3>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.step3Desc}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="py-16 sm:py-24">
                        <div className="max-w-7xl mx-auto px-6 text-center">
                            <motion.h2 initial="hidden" whileInView="visible" variants={FADE_IN_VARIANTS} viewport={{ once: true }} className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t.servicesTitle}</motion.h2>
                            <motion.p initial="hidden" whileInView="visible" variants={FADE_IN_VARIANTS} viewport={{ once: true }} className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t.servicesSubtitle}</motion.p>
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                                <ServiceCard icon={<FileText className="text-blue-600 dark:text-blue-400"/>} title={t.service1Title} description={t.service1Desc} />
                                <ServiceCard icon={<Megaphone className="text-blue-600 dark:text-blue-400"/>} title={t.service2Title} description={t.service2Desc} />
                                <ServiceCard icon={<Users className="text-blue-600 dark:text-blue-400"/>} title={t.service3Title} description={t.service3Desc} />
                            </div>
                        </div>
                    </section>
                </main>
                
                <Footer />
            </div>
        </>
    );
}