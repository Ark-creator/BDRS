import { useState } from "react";
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Footer from '@/Components/Residents/Footer'; 

const AccordionItem = ({ index, openIndex, toggleFAQ, question, answer }) => {
    const isOpen = index === openIndex;
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ring-1 ring-slate-200 hover:ring-blue-300">
            <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-semibold text-slate-800 hover:bg-sky-50 transition-colors"
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
                        <p className="text-slate-600 leading-relaxed">
                            {answer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Faq({ auth }) {
    const [openIndex, setOpenIndex] = useState(null);
    const [language, setLanguage] = useState("tl"); 

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="FAQ" />

            <div className="py-16 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                           {/* Inline SVG para sa Question Icon */}
                           <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            {language === "tl" ? "Mga Madalas Itanong" : "Frequently Asked Questions"}
                        </h1>
                        <p className="mt-4 text-lg text-slate-600">
                            Hanapin ang mga sagot sa mga karaniwang tanong tungkol sa serbisyo ng barangay.
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
                        <AccordionItem
                            index={0}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "Paano mag-request ng barangay clearance?" : "How to request a barangay clearance?"}
                            answer={language === 'tl' ? "Mag-login sa system, pumunta sa 'Request Documents', piliin ang 'Barangay Clearance', at kumpletuhin ang form. Hintayin ang confirmation mula sa admin." : "Log in to the system, go to 'Request Documents', select 'Barangay Clearance', and complete the form. Wait for the admin's confirmation after submission."}
                        />
                        <AccordionItem
                            index={1}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "Ano ang mga requirements para sa business permit?" : "What are the requirements for a business permit?"}
                            answer={language === 'tl' ? "Karaniwang kailangan ang valid ID, DTI/SEC registration, at barangay clearance. I-upload ang mga dokumento sa system para ma-validate." : "Requirements generally include a valid ID, DTI/SEC registration, and barangay clearance. Upload the documents for validation."}
                        />
                        <AccordionItem
                            index={2}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "Gaano katagal bago makuha ang dokumento?" : "How long before I receive my document?"}
                            answer={language === 'tl' ? "Kadalasan 1-3 working days pagkatapos ma-approve, depende sa dami ng request." : "Usually 1-3 working days after approval, depending on the number of requests."}
                        />
                        <AccordionItem
                            index={3}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "Pwede bang magbayad online gamit ang GCash?" : "Can I pay online using GCash?"}
                            answer={language === 'tl' ? "Oo, may GCash payment option para sa mga dokumentong may bayad tulad ng Barangay Business Clearance." : "Yes, GCash payment is available for paid documents like Barangay Business Clearance."}
                        />
                        <AccordionItem
                            index={4}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "May additional fee ba kapag rush processing?" : "Is there an extra fee for rush processing?"}
                            answer={language === 'tl' ? "Oo, may karagdagang bayad para sa rush requests depende sa uri ng dokumento." : "Yes, additional fees apply for rush requests depending on the document type."}
                        />
                         <AccordionItem
                            index={5}
                            openIndex={openIndex}
                            toggleFAQ={toggleFAQ}
                            question={language === 'tl' ? "Pwede bang ibang tao ang kumuha ng dokumento?" : "Can someone else claim my document?"}
                            answer={language === 'tl' ? "Oo, basta may dala siyang authorization letter at valid ID ninyong dalawa." : "Yes, with an authorization letter and valid IDs of both the requester and the representative."}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </AuthenticatedLayout>
    );
}