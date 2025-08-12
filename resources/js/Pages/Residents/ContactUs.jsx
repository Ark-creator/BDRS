import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Footer from '@/Components/Residents/Footer'; 

export default function ContactUs({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        subject: 'General Inquiry',
        message: '',
    });

    const subjects = ['General Inquiry', 'Feedback', 'Support', 'Complaint'];

    const submit = (e) => {
        e.preventDefault();
        // Ensure this route name matches the one defined in routes/web.php
        post(route('residents.contact.store')); // Corrected route name
    };
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Contact Us" />

            <div className="bg-sky-50">
                <div className="bg-slate-50 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Contact Us</h1>
                        <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            Get in Touch
                        </p>
                        <p className="max-w-2xl mt-5 mx-auto text-lg text-slate-500">
                            We're here to help and answer any question you might have.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-12">
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
                            <p className="mt-2 text-base text-slate-600">
                                Reach out to us through the channels below or visit us at the Barangay Hall.
                            </p>
                            
                            {/* Map Section */}
                            <div className="mt-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!4v1754743834400!6m8!1m7!1sGGjqFH-TIB8AE0_9inJJHA!2m2!1d15.31295437259569!2d120.9531832462395!3f249.86412101379125!4f9.946244509365542!5f0.7820865974627469"
                                    width="100%"
                                    height="350"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>

                            {/* Contact Details List */}
                            <div className="mt-8 space-y-2">
                                <a href="tel:+63441234567" className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Phone Number</h4>
                                        <p className="text-slate-500">(044) 329-6240</p>
                                    </div>
                                </a>
                                <a href="mailto:brgy.sanlorenzo@gapan.gov.ph" className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-sky-100 text-sky-600 rounded-lg">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Email Address</h4>
                                        <p className="text-slate-500">brgy.sanlorenzo@gapan.gov.ph</p>
                                    </div>
                                </a>
                                <div className="flex items-start gap-4 p-3">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-teal-100 text-teal-600 rounded-lg">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Office Address</h4>
                                        <p className="text-slate-500">Brgy. Hall, San Lorenzo, Gapan City, Nueva Ecija 3105</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3">
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Operating Hours</h4>
                                        <p className="text-slate-500">Mon - Fri: 8:00 AM – 5:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-slate-50 p-8 sm:p-12 rounded-lg border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8">Send a Message</h2>
                            <form onSubmit={submit} className="flex flex-col gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                                    <div className="flex flex-wrap gap-3">
                                        {subjects.map((subject) => (
                                            <label key={subject} className="cursor-pointer">
                                                <input
                                                    type="radio" name="subject" value={subject} checked={data.subject === subject}
                                                    onChange={(e) => setData('subject', e.target.value)}
                                                    className="sr-only peer"
                                                />
                                                <span className="px-4 py-2 block rounded-md text-sm font-medium border border-slate-300 bg-white text-slate-500 transition-colors peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">
                                                    {subject}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.subject && <p className="text-sm text-red-500 mt-2">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                                    <textarea
                                        id="message" rows="6" value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className="w-full p-4 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                                        placeholder="Write your detailed message here..."
                                    ></textarea>
                                    {errors.message && <p className="text-sm text-red-500 mt-2">{errors.message}</p>}
                                </div>

                                <div className="text-right">
                                    <button
                                        type="submit" disabled={processing}
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3 rounded-md shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </AuthenticatedLayout>
    );
}