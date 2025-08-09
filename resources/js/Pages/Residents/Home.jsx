import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Home({ auth }) {
    const [showRequestCards, setShowRequestCards] = useState(false);

    const handleRequestNowClick = () => {
        setShowRequestCards(true);
    };

    // Using simple, direct URL strings for links
    const papers = [
        { name: 'AKAP', icon: 'fa-solid fa-users', href: '/residents/papers/akap' },
        { name: 'Barangay Clearance', icon: 'fa-solid fa-file-alt', href: '/residents/papers/brgy-clearance' },
        { name: 'PWD', icon: 'fa-solid fa-wheelchair', href: '/residents/papers/pwd' },
        { name: 'GP Indigency', icon: 'fa-solid fa-hand-holding-heart', href: '/residents/papers/gp-indigency' },
        { name: 'Residency', icon: 'fa-solid fa-house-user', href: '/residents/papers/residency' },
        { name: 'Indigency', icon: 'fa-solid fa-file-invoice-dollar', href: '/residents/papers/indigency' },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Home</h2>}
        >
            <Head title="Home" />

            <div className="max-w-7xl mx-auto mt-10 overflow-hidden rounded-lg">
                <div className="flex bg-gray-600 text-white">
                    <div className="w-1/3 bg-gray-800">
                        {/* You can add an image or other content here */}
                    </div>
                    <div className="w-2/3 px-10 py-10 flex flex-col justify-between relative">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Announcements</p>
                            <h2 className="text-2xl font-semibold leading-snug mb-4">
                                Welcome to the Barangay Document Request System
                            </h2>
                            <p className="text-gray-300">
                                Easily request your barangay documents online. Follow the steps below to get started.
                            </p>
                            <a href="#" className="text-sm underline hover:text-gray-300 mt-4 inline-block">Read More</a>
                        </div>
                        <div className="flex items-center justify-between mt-10">
                            <div className="space-x-2">
                                <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
                            </div>
                            <button className="text-white hover:text-gray-300 transition">
                                <i className="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-20 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white flex flex-wrap gap-10 justify-center">

                    {/* STEP 1 */}
                    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[calc(33.333%-2.5rem)] flex justify-between items-center hover:scale-[1.02]">
                        <div className="text-left">
                            <div className="text-2xl font-semibold mb-2 tracking-wide">Step #1</div>
                            <p className="text-lg text-gray-300">
                                Click the <span className="text-white font-medium">"Request Now"</span> button to start.
                            </p>
                        </div>
                        <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
                            <i className="fa-solid fa-arrow-pointer fa-2xl"></i>
                        </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[calc(33.333%-2.5rem)] flex justify-between items-center hover:scale-[1.02]">
                        <div className="text-left">
                            <div className="text-2xl font-semibold mb-2 tracking-wide">Step #2</div>
                            <p className="text-lg text-gray-300">
                                Select a document type and fill out the request form carefully.
                            </p>
                        </div>
                        <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
                            <i className="fa-solid fa-pen-to-square fa-2xl"></i>
                        </div>
                    </div>

                    {/* STEP 3 */}
                    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[calc(33.333%-2.5rem)] flex justify-between items-center hover:scale-[1.02]">
                        <div className="text-left">
                            <div className="text-2xl font-semibold mb-2 tracking-wide">Step #3</div>
                            <p className="text-lg text-gray-300">
                                You'll be notified via email or SMS once your documents are ready for pickup.
                            </p>
                        </div>
                        <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
                            <i className="fa-solid fa-clock fa-2xl"></i>
                        </div>
                    </div>
                </div>
                
                <div className="mt-10 text-center">
                    <button
                        onClick={handleRequestNowClick}
                        className="bg-gray-800 hover:bg-gray-600 transition text-white font-bold px-8 py-4 rounded-md shadow-md hover:scale-105 duration-300"
                    >
                        REQUEST NOW &gt;
                    </button>
                </div>

                {/* Requestable Papers Cards Section */}
                {showRequestCards && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                        <h3 className="text-3xl font-bold text-center text-white mb-10">Select a Document to Request</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                            {papers.map((paper) => (
                                // Each card is wrapped in a Link component to make it clickable
                                <Link key={paper.name} href={paper.href} className="block h-full">
                                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col items-center justify-center text-center text-white hover:bg-gray-700 hover:scale-105 transition-transform duration-300 cursor-pointer">
                                        <div className="text-5xl mb-4 text-gray-400">
                                            <i className={paper.icon}></i>
                                        </div>
                                        <h4 className="text-lg font-semibold">{paper.name}</h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}