import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef } from 'react';
import Footer from '@/Components/Residents/Footer'; 
import Announcements from '@/Components/Residents/Announcements'; 

export default function Home({ auth }) {
    const [showRequestCards, setShowRequestCards] = useState(false);
    const documentsSectionRef = useRef(null);

    const handleRequestNowClick = () => {
        setShowRequestCards(true);
        setTimeout(() => {
            documentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const papers = [
        { 
            name: 'AKAP', 
            href: '/residents/papers/akap', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.375 3.375 0 019 15a3.375 3.375 0 01-1.749-3.082 3.375 3.375 0 01-1.749-3.082 3.375 3.375 0 011.749-3.082A3.375 3.375 0 019 5.812a3.375 3.375 0 011.749 3.082 3.375 3.375 0 011.749 3.082 3.375 3.375 0 01-1.749 3.082zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
        },
        { 
            name: 'Barangay Clearance', 
            href: '/residents/papers/brgy-clearance', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 
        },
        { 
            name: 'PWD Certificate', 
            href: '/residents/papers/pwd', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg> 
        },
        { 
            name: 'GP Indigency', 
            href: '/residents/papers/gp-indigency', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 110-18 9 9 0 010 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 10.5V18m-5.25-2.25h-2.25m10.5 0H18m-3.75 3.75l-1.5-1.5m3 0l1.5-1.5m-5.25-5.25l-1.5 1.5m3 0l1.5 1.5" /></svg>
        },
        { 
            name: 'Certificate of Residency', 
            href: '/residents/papers/residency', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg> 
        },
        { 
            name: 'Certificate of Indigency', 
            href: '/residents/papers/indigency', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15-3V4.875c0-.621-.504-1.125-1.125-1.125H9.375c-.621 0-1.125.504-1.125 1.125V9m9 3h-3" /></svg> 
        },
    ];
    return (
        <AuthenticatedLayout user={auth.user}>
            {/* FIX: The problematic <div className="min-h-full"> wrapper is removed. */}
            {/* We now use a React Fragment <> to return multiple elements. */}
            <>
                <Head title="Home" />

                <div className="bg-sky-50">
                    <main>
                        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                            
                            <Announcements />

                            <div className="py-16 sm:py-24">
                                <div className="text-center">
                                    <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">How It Worksss</h2>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A Simple 3-Step Process</p>
                                </div>
                                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* ... Step 1, 2, 3 divs ... */}
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
                                            {papers.map((paper) => (
                                                <Link 
                                                    key={paper.name} 
                                                    href={paper.href} 
                                                    className="block group"
                                                >
                                                    <div className="bg-slate-50 rounded-xl ring-1 ring-slate-200 p-6 h-full flex flex-col items-center justify-center text-center text-slate-700 hover:ring-blue-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                                        <div className="p-4 rounded-full bg-white text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            {paper.icon}
                                                        </div>
                                                        <h4 className="mt-4 text-sm font-semibold">{paper.name}</h4>
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