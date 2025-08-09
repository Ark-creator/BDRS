import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Footer from '@/Components/Residents/Footer'; 

export default function AboutUs({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="About Us" />

            <div className="bg-white">
                <main>
                    <div className="relative max-w-7xl mx-auto py-16 sm:py-24 px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Our Mission</h1>
                                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                                    Connecting Government and Community
                                </p>
                                <p className="mt-6 text-lg text-slate-600">
                                    We are a digital platform designed to make accessing local government services and documents faster, more transparent, and easier for you.
                                </p>
                            </div>
                            <div className="w-full h-80 lg:h-full rounded-2xl overflow-hidden">
                                <img 
                                    src="/images/brgy.png" 
                                    alt="Government Service"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 py-16 sm:py-24">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Our Principles</h2>
                                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">
                                    Guiding our commitment to public service and excellence.
                                </p>
                            </div>
                            <div className="mt-12 grid md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-xl ring-1 ring-slate-200">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Our Vision</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        A modern and inclusive local government where services are delivered with integrity, innovation, and a tangible impact on the lives of our citizens.
                                    </p>
                                </div>
                                <div className="bg-white p-8 rounded-xl ring-1 ring-slate-200">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Our Goal</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        To provide fast, transparent, and accessible services to every citizen, utilizing digital solutions to make document processing simple and efficient.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === BAGONG SECTION DITO === */}
                    <div className="py-16 sm:py-24">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                             <div className="text-center">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Latest Announcements</h2>
                                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500">
                                    Stay updated with the latest news and events in our community.
                                </p>
                            </div>
                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="bg-white rounded-lg shadow-md overflow-hidden ring-1 ring-slate-900/5">
                                    <img src="" alt="Voter Registration" className="h-56 w-full object-cover"/>
                                    <div className="p-6">
                                        <p className="text-sm font-semibold text-blue-600">PUBLIC SERVICE</p>
                                        <h3 className="mt-2 text-xl font-bold text-slate-900">Voter Registration for 2026 Elections</h3>
                                        <p className="mt-1 text-xs text-slate-500">September 1 - 5, 2025</p>
                                        <p className="mt-4 text-sm text-slate-600">COMELEC will facilitate voter registration at the Gapan City Hall. Please bring a valid ID.</p>
                                        <Link href="#" className="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800">Read More &rarr;</Link>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-md overflow-hidden ring-1 ring-slate-900/5">
                                    <img src="" alt="Vaccination" className="h-56 w-full object-cover"/>
                                    <div className="p-6">
                                        <p className="text-sm font-semibold text-blue-600">HEALTH</p>
                                        <h3 className="mt-2 text-xl font-bold text-slate-900">Free Anti-Flu Vaccination Drive</h3>
                                        <p className="mt-1 text-xs text-slate-500">August 25, 2025</p>
                                        <p className="mt-4 text-sm text-slate-600">A free vaccination drive will be held at the Barangay San Lorenzo covered court. Open to all ages.</p>
                                        <Link href="#" className="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800">Read More &rarr;</Link>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-md overflow-hidden ring-1 ring-slate-900/5">
                                    <img src="" alt="Fiesta" className="h-56 w-full object-cover"/>
                                    <div className="p-6">
                                        <p className="text-sm font-semibold text-blue-600">COMMUNITY EVENT</p>
                                        <h3 className="mt-2 text-xl font-bold text-slate-900">Barangay San Lorenzo Fiesta 2025</h3>
                                        <p className="mt-1 text-xs text-slate-500">August 16, 2025</p>
                                        <p className="mt-4 text-sm text-slate-600">Join us for a day of celebration, games, and presentations in honor of our patron saint.</p>
                                        <Link href="#" className="mt-4 inline-block font-semibold text-blue-600 hover:text-blue-800">Read More &rarr;</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* === END NG BAGONG SECTION === */}

                    <div className="py-16 sm:py-24">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Core Values</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="text-center">
                                    <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Integrity</h3>
                                </div>
                                <div className="text-center">
                                    <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Efficiency</h3>
                                </div>
                                <div className="text-center">
                                    <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Citizen-Centric</h3>
                                </div>
                                <div className="text-center">
                                    <div className="mb-4 inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 text-blue-600"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Innovation</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 py-16 sm:py-24">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8">
                            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Meet Our Officials</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="text-center">
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg" src="/images/mayorjoy.jpg" alt="City Mayor" />
                                    <h3 className="text-xl font-bold text-slate-900">Hon. Joy Pascual</h3>
                                    <p className="text-blue-600 font-semibold">City Mayor</p>
                                </div>
                                <div className="text-center">
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg" src="/images/amparado.png" alt="City Councilor" />
                                    <h3 className="text-xl font-bold text-slate-900">Paul Michael Amparado</h3>
                                    <p className="text-blue-600 font-semibold">City Councilor</p>
                                </div>
                                <div className="text-center">
                                    <img className="w-40 h-40 rounded-full mx-auto mb-4 object-cover ring-4 ring-white shadow-lg" src="/images/secretary.png" alt="Barangay Secretary" />
                                    <h3 className="text-xl font-bold text-slate-900">Cory DC. Navarro</h3>
                                    <p className="text-blue-600 font-semibold">Barangay Secretary</p>
                                </div>
                            </div>
                        </div>
                    </div>
                      
                    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 sm:py-24">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Our Journey</h2>
                        <div className="relative border-l-2 border-slate-200">
                            <div className="mb-12 ml-8">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full -left-4 ring-4 ring-white">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                    Conceptualization <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">December 2024</span>
                                </h3>
                                <p className="text-base text-slate-500">The idea was born and the core objectives of the system were outlined by the team.</p>
                            </div>
                            <div className="mb-12 ml-8">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full -left-4 ring-4 ring-white">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                    Alpha & Beta Testing <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">August 2025</span>
                                </h3>
                                <p className="text-base text-slate-500">We released a beta version to a select group to gather feedback and improve the platform.</p>
                            </div>
                            <div className="ml-8">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full -left-4 ring-4 ring-white">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-9 9a9 9 0 019-9" /></svg>
                                </span>
                                <h3 className="flex items-center mb-1 text-lg font-semibold text-slate-900">
                                    Future Development <span className="text-blue-600 bg-blue-100 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full ml-3">Future</span>
                                </h3>
                                <p className="text-base text-slate-500">We are committed to adding new features and integrating with other local government units.</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </AuthenticatedLayout>
    );
}