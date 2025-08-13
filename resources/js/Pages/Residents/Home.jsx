import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import Footer from '@/Components/Residents/Footer';
import Announcements from '@/Components/Residents/Announcements';

// Helper component to render the correct icon based on the document name from the database.
// This keeps your main component clean.
const DocumentIcon = ({ documentName }) => {
    const icons = {
        'Solo Parent': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.375 3.375 0 019 15a3.375 3.375 0 01-1.749-3.082 3.375 3.375 0 01-1.749-3.082 3.375 3.375 0 011.749-3.082A3.375 3.375 0 019 5.812a3.375 3.375 0 011.749 3.082 3.375 3.375 0 011.749 3.082 3.375 3.375 0 01-1.749 3.082zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        // 'Barangay Clearance': <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
        // Add other document names from your database and their corresponding icons here
    };

    // Return the matching icon or a default one if no match is found
    return icons[documentName] || <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
};

// The component now accepts `documentTypes` as a prop from the controller
export default function Home({ auth, documentTypes }) {
    const [showRequestCards, setShowRequestCards] = useState(false);
    const documentsSectionRef = useRef(null);

    const handleRequestNowClick = () => {
        setShowRequestCards(true);
        setTimeout(() => {
            documentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // The hardcoded `papers` array has been removed.

    return (
        <AuthenticatedLayout user={auth.user}>
            <>
                <Head title="Home" />

                <div className="bg-slate-50">
                    <main>
                        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                            
                            <Announcements />

                            
                            <div className="py-16 sm:py-24">
                                {/* Main container for the entire "How It Works" section */}
                                <div className="bg-slate-50" id="how-it-works">
                                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                                    <div className="mx-auto max-w-2xl text-center">
                                        <h2 className="text-base font-semibold leading-7 text-blue-600">HOW IT WORKS</h2>
                                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                            A Simple 3-Step Process
                                        </p>
                                        <p className="mt-6 text-lg leading-8 text-gray-600">
                                            Get your project started with us by following this easy process.
                                        </p>
                                    </div>

                                    {/* Grid container for the 3 steps with improved UI/UX */}
                                    <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                                        
                                        {/* Step 1: Click the Request Button */}
                                        <div className="group flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                                            <div className="text-4xl font-bold text-blue-300 transition-colors group-hover:text-blue-500">01</div>
                                            <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-8 ring-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25a8.25 8.25 0 00-8.25 8.25c0 1.913.64 3.705 1.75 5.25l.224.332a23.102 23.102 0 014.256 6.175 1.5 1.5 0 002.542 0 23.102 23.102 0 014.256-6.175l.224-.332a8.25 8.25 0 001.75-5.25A8.25 8.25 0 0012 2.25z" />
                                                </svg>
                                            </div>
                                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Click Request</h3>
                                            <p className="mt-2 text-base text-gray-600">Start the process by selecting and clicking the 'Request' button.</p>
                                        </div>
                                        
                                        {/* Step 2: Fill Out the Details */}
                                        <div className="group flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                                            <div className="text-4xl font-bold text-blue-300 transition-colors group-hover:text-blue-500">02</div>
                                            <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-8 ring-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h10.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25-2.25H6.75a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25z" />
                                                </svg>
                                            </div>
                                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Fill Out Details</h3>
                                            <p className="mt-2 text-base text-gray-600">Provide all the necessary and accurate information in the form.</p>
                                        </div>
                                        
                                        {/* Step 3: Wait for Notification */}
                                        <div className="group flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                                            <div className="text-4xl font-bold text-blue-300 transition-colors group-hover:text-blue-500">03</div>
                                            <div className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-8 ring-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                </svg>
                                            </div>
                                            <h3 className="mt-6 text-xl font-semibold text-gray-900">Get Notified</h3>
                                            <p className="mt-2 text-base text-gray-600">Wait for the confirmation and updates from our team after submission.</p>
                                        </div>
                                        
                                    </div>
                                </div>
                                </div>
                                <div className="mt-16 text-center">
                                    <button
                                        onClick={handleRequestNowClick}
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
                                    >
                                        Request a Document Now
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>
                                    </button>
                                </div>
                            </div>
                            
                            {showRequestCards && (
                                <div ref={documentsSectionRef} className="bg-white py-16 sm:py-24">
                                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Select a Document</h2>
                                            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">
                                                Click on a card to start your request.
                                            </p>
                                        </div>
                                        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                            {/* --- MODIFICATION --- */}
                                            {/* We now map over the `documentTypes` prop from the database */}
                                            {documentTypes.map((docType) => (
                                                <Link 
                                                    key={docType.id} 
                                                    // The link now points to a single, dynamic route with the document's ID
                                                    href={route('residents.request.create', docType.id)} 
                                                    className="block group"
                                                >
                                                    <div className="bg-slate-50 rounded-xl ring-1 ring-slate-200 p-6 h-full flex flex-col items-center justify-center text-center text-slate-700 hover:ring-blue-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                                        <div className="p-4 rounded-full bg-white text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            {/* The icon is now dynamically rendered */}
                                                            <DocumentIcon documentName={docType.name} />
                                                        </div>
                                                        <h4 className="mt-4 text-sm font-semibold">{docType.name}</h4>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                    <Footer />
                </div>
            </>
        </AuthenticatedLayout>
    );
}
