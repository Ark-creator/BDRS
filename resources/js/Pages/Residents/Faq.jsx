import { useState, useEffect } from "react";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Footer from '@/Components/Residents/Footer';
import { Star, CheckCircle, Smile, Frown, Meh, Laugh, Heart } from 'lucide-react';
import clsx from 'clsx';

const AccordionItem = ({ index, openIndex, toggleFAQ, question, answer }) => {
    const isOpen = index === openIndex;
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-blue-400 dark:hover:ring-blue-600">
            <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-semibold text-slate-800 dark:text-slate-100 hover:bg-sky-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <span>{question}</span>
                <svg
                    className={`h-6 w-6 text-blue-600 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`grid overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="px-6 pb-4">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {answer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StarRating = ({ rating, setRating, setHover, hover }) => {
    return (
        <div className="flex justify-center items-center space-x-2">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        className={clsx(
                            "transition-all duration-200 transform hover:scale-125 focus:outline-none",
                            ratingValue <= (hover || rating) ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"
                        )}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <Star className="w-10 h-10" fill="currentColor" />
                    </button>
                );
            })}
        </div>
    );
};

const FeedbackSection = ({ language, onRateSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const ratingLabels = {
        tl: [
            { text: "", icon: null },
            { text: "Kulang", icon: <Frown className="w-6 h-6 text-red-500" /> },
            { text: "Okay lang", icon: <Meh className="w-6 h-6 text-amber-500" /> },
            { text: "Magaling", icon: <Smile className="w-6 h-6 text-sky-500" /> },
            { text: "Mahusay", icon: <Laugh className="w-6 h-6 text-blue-500" /> },
            { text: "Napakahusay!", icon: <Heart className="w-6 h-6 text-pink-500" /> }
        ],
        en: [
            { text: "", icon: null },
            { text: "Poor", icon: <Frown className="w-6 h-6 text-red-500" /> },
            { text: "Fair", icon: <Meh className="w-6 h-6 text-amber-500" /> },
            { text: "Good", icon: <Smile className="w-6 h-6 text-sky-500" /> },
            { text: "Very Good", icon: <Laugh className="w-6 h-6 text-blue-500" /> },
            { text: "Excellent!", icon: <Heart className="w-6 h-6 text-pink-500" /> }
        ],
    };

    const handleSubmit = () => {
        if (rating > 0) {
            onRateSubmit(rating); 
            setSubmitted(true);
        }
    };

    const currentLabel = ratingLabels[language][hover || rating] || ratingLabels[language][0];

    return (
        <div className=" rounded-lg  p-8 text-center  transition-all duration-300 ">
            {submitted ? (
                <div className="flex flex-col items-center justify-center h-48 transition-opacity duration-500">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {language === 'tl' ? "Salamat sa iyong feedback!" : "Thank you for your feedback!"}
                    </h3>
                </div>
            ) : (
                <>
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 mt-6">
                        {language === 'tl' ? "Kamusta ang aming serbisyo?" : "How was our service?"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {language === 'tl' ? "Bigyan kami ng rating para mapabuti pa ito." : "Let us know how we did."}
                    </p>
                    <div className="h-8 mb-4 flex items-center justify-center gap-2">
                        {currentLabel.icon}
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 transition-opacity duration-300">
                           {currentLabel.text}
                        </p>
                    </div>
                    <div className="mb-8">
                        <StarRating rating={rating} setRating={setRating} hover={hover} setHover={setHover} />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 disabled:scale-100"
                    >
                        {language === 'tl' ? "I-submit ang Rating" : "Submit Rating"}
                    </button>
                </>
            )}
        </div>
    );
};

const Toast = ({ message, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up">
            <CheckCircle className="w-6 h-6 text-green-400 dark:text-green-600" />
            <span className="font-semibold">{message}</span>
        </div>
    );
};


export default function Faq({ auth }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [language, setLanguage] = useState("tl");
    const [toast, setToast] = useState({ show: false, message: "" });

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleRatingSubmit = (rating) => {
        console.log("Submitted Rating:", rating);
        const message = language === 'tl' 
            ? `Salamat sa iyong ${rating}-star na rating!`
            : `Thank you for your ${rating}-star rating!`;
        setToast({ show: true, message });
    };

    const faqs = {
        tl: [
            { q: "Paano mag-request ng barangay clearance?", a: "Mag-login sa system, pumunta sa 'Request Documents', piliin ang 'Barangay Clearance', at kumpletuhin ang form. Hintayin ang confirmation mula sa admin." },
            { q: "Ano ang mga requirements para sa business permit?", a: "Karaniwang kailangan ang valid ID, DTI/SEC registration, at barangay clearance. I-upload ang mga dokumento sa system para ma-validate." },
            { q: "Gaano katagal bago makuha ang dokumento?", a: "Kadalasan 1-3 working days pagkatapos ma-approve, depende sa dami ng request." },
            { q: "Pwede bang magbayad online gamit ang GCash?", a: "Oo, may GCash payment option para sa mga dokumentong may bayad tulad ng Barangay Business Clearance." },
            { q: "May additional fee ba kapag rush processing?", a: "Walang karagdagang bayad para sa rush requests ng dokumento." },
            { q: "Pwede bang ibang tao ang kumuha ng dokumento?", a: "Oo, basta may dala siyang authorization letter at valid ID ninyong dalawa." },
        ],
        en: [
            { q: "How to request a barangay clearance?", a: "Log in to the system, go to 'Request Documents', select 'Barangay Clearance', and complete the form. Wait for the admin's confirmation after submission." },
            { q: "What are the requirements for a business permit?", a: "Requirements generally include a valid ID, DTI/SEC registration, and barangay clearance. Upload the documents for validation." },
            { q: "How long before I receive my document?", a: "Usually 1-3 working days after approval, depending on the number of requests." },
            { q: "Can I pay online using GCash?", a: "Yes, GCash payment is available for paid documents like Barangay Business Clearance." },
            { q: "Is there an extra fee for rush processing?", a: "There are no additional fees for rush document requests." },
            { q: "Can someone else claim my document?", a: "Yes, with an authorization letter and valid IDs of both the requester and the representative." },
        ]
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="FAQ" />
            <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>

            <div className="py-16 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            {language === "tl" ? "Mga Madalas Itanong" : "Frequently Asked Questions"}
                        </h1>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                            {language === "tl"
                                ? "Hanapin ang mga sagot sa mga karaniwang tanong tungkol sa serbisyo ng barangay."
                                : "Find answers to common questions about barangay services."}
                        </p>
                    </div>
                    
                    <div className="text-center mb-10">
                        <button
                            onClick={() => setLanguage(language === "tl" ? "en" : "tl")}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m4 13l4-4M9 15v2m6-13l-4 4m0 0l-4-4m4 4v12" />
                            </svg>
                            {language === "tl" ? "Translate to English" : "Isalin sa Tagalog"}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {faqs[language].map((faq, index) => (
                             <AccordionItem
                                key={index}
                                index={index}
                                openIndex={openIndex}
                                toggleFAQ={toggleFAQ}
                                question={faq.q}
                                answer={faq.a}
                            />
                        ))}
                    </div>

                    <div className="mt-16">
                        <FeedbackSection language={language} onRateSubmit={handleRatingSubmit} />
                    </div>

                </div>
            </div>
            <Footer />
            <Toast 
                show={toast.show} 
                message={toast.message}
                onClose={() => setToast({ show: false, message: "" })}
            />
        </AuthenticatedLayout>
    );
}
