import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

// --- HELPER & UI COMPONENTS ---

const AuthLayout = ({ title, description }) => (
    // TINAMA ANG TYPO DITO: from md:w-12 to md:w-1/2
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url(/images/brgy.png)"}}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-blue-800/95"></div>
        <div className="relative z-10">
            <div className="flex items-center mb-8">
                <div className="w-16 h-16 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 p-2 shadow-lg">
                    <img src="/images/logo1.jpg" alt="Barangay Logo" className="w-full h-full rounded-full" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-shadow">{title}</h1>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed text-shadow-sm">{description}</p>
            <p className="text-xs text-blue-200 mt-12 opacity-75">Gapan City, Nueva Ecija</p>
        </div>
    </div>
);

const EmailSentIcon = () => (
    <svg className="h-20 w-20 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 13.5V8.5C22 7.11929 20.8807 6 19.5 6H4.5C3.11929 6 2 7.11929 2 8.5V15.5C2 16.8807 3.11929 18 4.5 18H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8L10.2625 11.8325C11.2383 12.424 12.7617 12.424 13.7375 11.8325L20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 15.5L16.5 18L15 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18.5" cy="18.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- MAIN VERIFY EMAIL COMPONENT ---

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const [cooldown, setCooldown] = useState(0);
    const canResend = cooldown === 0;

    useEffect(() => {
        if (status === 'verification-link-sent') {
            setCooldown(60);
        }
    }, [status]);
    
    useEffect(() => {
        if (!canResend) {
            const timer = setInterval(() => {
                setCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const submit = (e) => {
        e.preventDefault();
        if (!canResend || processing) return;

        post(route('verification.send'), {
            onSuccess: () => setCooldown(60),
        });
    };

    const isVerificationSent = status === 'verification-link-sent';

    return (
        <div className="bg-blue-50">
            <Head title="Email Verification" />
            <style>{`.text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.2); } .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.15); }`}</style>
            
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">
                    <AuthLayout
                        title="One Last Step..."
                        description="We've sent a verification link to your email address. Please click the link to activate your account and complete your registration."
                    />

                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex justify-center mb-6">
                            <EmailSentIcon />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">
                            Check Your Inbox
                        </h2>
                        
                        <p className="text-gray-600 mb-6 text-center text-sm">
                            Before proceeding, please find the email we sent you. If you don't see it, be sure to check your spam folder.
                        </p>

                        {isVerificationSent && !processing && (
                            <div className="mb-4 flex items-center justify-center gap-2 font-medium text-sm text-green-700 bg-green-100 p-3 rounded-lg text-center">
                                <CheckCircleIcon />
                                A new verification link has been sent successfully.
                            </div>
                        )}

                        <div className="mt-4 text-center text-sm">
                            <p className="text-gray-600 mb-2">
                                Didn't receive the email?
                            </p>
                            <button
                                onClick={submit}
                                disabled={!canResend || processing}
                                className="font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-all duration-200"
                            >
                                {processing
                                    ? 'Sending...'
                                    : canResend
                                    ? 'Resend Verification Email'
                                    : `Resend again in ${cooldown}s`
                                }
                            </button>
                        </div>

                        <div className="mt-8 pt-4 border-t border-blue-100 text-center text-sm">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Not you? Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}