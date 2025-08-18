import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { FileText, Megaphone, Users, ArrowRight, UserPlus, MousePointerClick, CheckCircle, ChevronDown, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
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
        faqTitle: "Frequently Asked Questions",
        faqSubtitle: "Have questions? We've got answers. If you can't find your answer here, feel free to contact us.",
        faqs: [
            { q: "How do I register for an account?", a: "Simply click the 'Register' button on the top right corner of the page. Fill out the necessary information, verify your account, and you're all set to use our services." },
            { q: "What information is needed to register?", a: "To register, you will need to provide your full name, a valid email address, a mobile number, and your complete address within the barangay. Make sure the information you provide is accurate for verification purposes." },
            { q: "How do I request a document?", a: "Once logged in, go to your dashboard and select 'Request a Document'. Choose the document you need from the list, fill out the form, and submit your request. It's that easy!" },
            { q: "How long is the processing time?", a: "Standard processing time is typically 1-3 business days. The duration may vary depending on the type of document requested and the verification process." },
            { q: "How will I know if my document is ready for pickup?", a: "You will receive an SMS and an in-app notification once your request is processed and ready for pickup. You can also track the status of your request on your dashboard." },
            { q: "Can I pay extra for faster processing?", a: "No, we do not offer an expedited processing option for an additional fee. We process all requests in the order they are received to ensure fairness for all residents." },
            { q: "Are there any fees for requesting documents?", a: "Most document requests like Certificates of Indigency and Residency are free of charge. However, a fee is required for the Barangay Business Clearance as mandated by local ordinances." },
        ]
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
        faqTitle: "Mga Madalas Itanong (FAQ)",
        faqSubtitle: "May mga tanong ka ba? Mayroon kaming mga sagot. Kung hindi mo mahanap ang sagot dito, huwag mag-atubiling makipag-ugnayan sa amin.",
        faqs: [
            { q: "Paano ako makakapag-rehistro ng account?", a: "I-click lamang ang 'Register' button sa kanang itaas na bahagi ng page. Punan ang mga kinakailangang impormasyon, i-verify ang iyong account, at handa ka nang gumamit ng aming mga serbisyo." },
            { q: "Anong impormasyon ang kailangan para makapag-rehistro?", a: "Para makapag-rehistro, kailangan mong ibigay ang iyong buong pangalan, isang valid na email address, mobile number, at ang iyong kumpletong address sa loob ng barangay. Siguraduhing wasto ang impormasyong iyong ibibigay para sa verification." },
            { q: "Paano ako hihiling ng dokumento?", a: "Kapag naka-login, pumunta sa iyong dashboard at piliin ang 'Request a Document'. Piliin ang dokumentong kailangan mo mula sa listahan, sagutan ang form, at i-submit ang iyong request. Ganoon lang kadali!" },
            { q: "Gaano katagal ang proseso?", a: "Ang karaniwang oras ng pagproseso ay 1-3 business days. Maaaring mag-iba ang tagal depende sa uri ng dokumento at sa proseso ng verification." },
            { q: "Paano ko malalaman kung handa na ang aking dokumento?", a: "Makakatanggap ka ng SMS at in-app notification kapag ang iyong request ay naproseso na at handa nang kunin. Maaari mo ring subaybayan ang status nito sa iyong dashboard." },
            { q: "Maaari ba akong magbayad ng dagdag para sa mas mabilis na proseso?", a: "Hindi po, wala kaming ino-offer na pabilisin ang proseso kapalit ng dagdag na bayad. Pinoproseso namin ang lahat ng request ayon sa pagkakasunod-sunod ng pagkatanggap nito upang maging patas sa lahat ng residente." },
            { q: "May bayad ba ang pag-request ng dokumento?", a: "Karamihan sa mga dokumento tulad ng Certificate of Indigency at Residency ay libre. Gayunpaman, may kaukulang bayad para sa Barangay Business Clearance ayon sa itinakda ng lokal na ordinansa." },
        ]
    }
};

const ServiceCard = ({ icon, title, description }) => (
    <motion.div 
        className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-blue-500/20 hover:shadow-2xl"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
        <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/50 p-3 rounded-full w-fit mb-4 shadow-inner">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </motion.div>
);

const StepCard = ({ icon, title, description }) => (
    <div className="relative flex flex-col items-center text-center px-4">
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 ring-8 ring-white dark:ring-slate-900 shadow-lg">
            {icon}
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
    </div>
);

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className={clsx(
                "mb-4 rounded-xl border transition-all duration-300",
                isOpen 
                    ? "border-blue-500 bg-white dark:bg-slate-800/50" 
                    : "border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/60"
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-start text-left p-6"
            >
                <div className="flex items-start gap-4">
                    <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100">{question}</h3>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="ml-4">
                    <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                       <div className="px-6 pb-6 pl-16 text-slate-600 dark:text-slate-400 text-sm">
                           {answer}
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const AuroraBackground = () => (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
            className="absolute top-[20%] left-[1%] w-[40rem] h-[40rem] bg-gradient-to-tr from-sky-200 to-blue-500 rounded-full blur-3xl"
            animate={{ x: [-20, 20, -20], y: [-20, 20, -20], rotate: [0, 5, 0], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
    </div>
);

export default function Welcome({ auth }) {
    const [scrolled, setScrolled] = useState(false);
    const [language, setLanguage] = useState('en');

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    
    const stepsRef = useRef(null);
    const isInView = useInView(stepsRef, { once: true, amount: 0.4 });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const t = content[language];

    const slideInUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const staggerContainer = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.2 } },
    };

    return (
        <>
            <Head title={t.title} />
            <div className="relative overflow-x-hidden bg-sky-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 isolate">
                <motion.div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50" style={{ scaleX }} />
                
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
                        <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-8 max-w-7xl mx-auto px-6 pt-28 pb-16 lg:pt-24 lg:pb-12 z-10">
                            <motion.div className="text-center lg:text-left" initial="hidden" animate="visible" variants={staggerContainer}>
                                <motion.span variants={slideInUp} className="inline-flex items-center rounded-full bg-sky-100 dark:bg-sky-900/50 px-3 py-1 text-sm font-medium text-sky-800 dark:text-sky-300">{t.tagline}</motion.span>
                                <motion.div variants={slideInUp} className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white min-h-[140px] md:min-h-[160px] lg:min-h-0">
                                    <TypeAnimation
                                        sequence={[
                                            t.heroTitle,
                                            3000,
                                            '', // Ito ang mag-trigger ng delete
                                            500 // Maikling pause bago mag-loop
                                        ]}
                                        wrapper="h1"
                                        speed={70}
                                        deletionSpeed={40}
                                        cursor={true}
                                        repeat={Infinity}
                                    />
                                </motion.div>
                                <motion.p variants={slideInUp} className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">{t.heroSubtitle}</motion.p>
                                <motion.div variants={slideInUp} className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                                    <Link href={route('register')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-blue-600 transition-transform hover:scale-105">
                                        {t.getStarted}
                                        <ArrowRight size={20} />
                                    </Link>
                                </motion.div>
                            </motion.div>
                             <motion.div className="w-full mt-10 lg:mt-0" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                                <video src="/images/solid.mp4" className="w-full h-auto rounded-xl" autoPlay loop muted playsInline>
                                    Your browser does not support the video tag.
                                </video>
                            </motion.div>
                        </div>
                    </div>

                    <section className="py-20 sm:py-28 relative bg-white dark:bg-slate-900/70 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-[url('/images/grid.svg')] [mask-image:linear-gradient(to_bottom,white,transparent,white)] dark:opacity-20" />
                        <div className="relative max-w-7xl mx-auto px-6 text-center">
                            <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} viewport={{ once: true }}>
                                <motion.h2 variants={slideInUp} className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{t.howItWorksTitle}</motion.h2>
                                <motion.p variants={slideInUp} className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t.howItWorksSubtitle}</motion.p>
                            </motion.div>
                            <div ref={stepsRef} className="mt-20 relative">
                                <motion.div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%-5rem)] bg-slate-200 dark:bg-slate-700 md:hidden" style={{ scaleY: isInView ? 1 : 0, originY: 0 }} transition={{ duration: 1, ease: "easeOut" }} />
                                <motion.div className="absolute top-10 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 hidden md:block" style={{ scaleX: isInView ? 1 : 0, originX: 0 }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} />
                                <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} viewport={{ once: true, amount: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-y-0 md:gap-x-8">
                                    <motion.div variants={slideInUp}><StepCard icon={<UserPlus className="h-8 w-8 text-sky-600 dark:text-sky-400" />} title={t.step1Title} description={t.step1Desc} /></motion.div>
                                    <motion.div variants={slideInUp}><StepCard icon={<MousePointerClick className="h-8 w-8 text-sky-600 dark:text-sky-400" />} title={t.step2Title} description={t.step2Desc} /></motion.div>
                                    <motion.div variants={slideInUp}><StepCard icon={<CheckCircle className="h-8 w-8 text-sky-600 dark:text-sky-400" />} title={t.step3Title} description={t.step3Desc} /></motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    <section className="relative py-20 sm:py-28 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <svg className="absolute -top-40 -left-20 w-[80rem] h-auto text-sky-100/50 dark:text-blue-900/20" width="1280" height="1280" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1096.5 528c-303 62-436 220.5-436 436s133 374 436 436 436-133 436-436c0-215.5-133-374-436-436Zm-872 0C-88.5 590 44.5 748.5 44.5 964s-133 374-436 436-436-133-436-436c0-215.5 133-374 436-436Z" fill="currentColor"/></svg>
                        </div>
                        <div className="relative max-w-7xl mx-auto px-6 text-center">
                             <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} viewport={{ once: true }}>
                                <motion.h2 variants={slideInUp} className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{t.servicesTitle}</motion.h2>
                                <motion.p variants={slideInUp} className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t.servicesSubtitle}</motion.p>
                            </motion.div>
                            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                                <ServiceCard icon={<FileText className="text-blue-600 dark:text-blue-400"/>} title={t.service1Title} description={t.service1Desc} />
                                <ServiceCard icon={<Megaphone className="text-blue-600 dark:text-blue-400"/>} title={t.service2Title} description={t.service2Desc} />
                                <ServiceCard icon={<Users className="text-blue-600 dark:text-blue-400"/>} title={t.service3Title} description={t.service3Desc} />
                            </div>
                        </div>
                    </section>

                    <section className="py-20 sm:py-28 bg-white dark:bg-slate-900/70">
                        <div className="max-w-3xl mx-auto px-6">
                            <motion.div 
                                initial="hidden" 
                                whileInView="visible" 
                                variants={staggerContainer} 
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <motion.div variants={slideInUp} className="flex items-center justify-center gap-3">
                                    <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400"/>
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{t.faqTitle}</h2>
                                </motion.div>

                                <motion.p variants={slideInUp} className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t.faqSubtitle}</motion.p>
                            </motion.div>
                            <div className="mt-12">
                                {t.faqs.map((faq, i) => (
                                    <FaqItem key={i} question={faq.q} answer={faq.a} />
                                ))}
                            </div>
                        </div>
                    </section>
                </main>
                
                <Footer />
            </div>
        </>
    );
}