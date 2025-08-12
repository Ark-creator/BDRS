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

                <div className="bg-sky-50">
                    <main>
                        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                            
                            <Announcements />

                            {/* This section for the "How it Works" and "Request Now" button remains the same */}
                            <div className="py-16 sm:py-24">
                                <div className="text-center">
                                    <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">How It Works</h2>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A Simple 3-Step Process</p>
                                </div>
                                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* ... Your Step 1, 2, 3 components ... */}
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