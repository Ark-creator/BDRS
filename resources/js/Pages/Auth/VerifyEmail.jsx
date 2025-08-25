// resources/js/Pages/Auth/VerifyEmail.jsx

import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

// 1. Reusable Auth Layout Component
const AuthLayout = ({ title, description }) => (
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url(/images/brgy.png)"}}>
        <div className="absolute inset-0 bg-blue-800 opacity-75"></div>
        <div className="relative z-10">
            <div className="flex items-center mb-8">
                <div className="w-16 h-16 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30">
                    <img className="rounded-full p-2" src="/images/logo1.jpg" alt="logo" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed">{description}</p>
            <p className="text-xs text-blue-200 mt-12 opacity-75">Gapan City, Nueva Ecija</p>
        </div>
    </div>
);

// 2. Mail Icon Component
const MailIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;

// 3. Main Verify Email Page
export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const isVerificationSent = status === 'verification-link-sent';

    return (
        <div className="bg-sky-50">
            <Head title="Email Verification" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">

                    <AuthLayout
                        title="Verify Your Email"
                        description="A verification link has been sent to the email address you provided. Please check your inbox and click on the link to continue."
                    />

                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <div className="flex justify-center mb-6">
                            <MailIcon className="h-16 w-16 text-blue-600 animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                            Verify Your Email Address
                        </h2>
                        <p className="text-slate-500 mb-6 text-center">
                            You're almost there! Before proceeding, please check your email for a verification link.
                        </p>

                        {isVerificationSent && (
                            <div className="mb-4 font-medium text-sm text-green-600 bg-green-50 p-3 rounded-lg text-center">
                                A new verification link has been sent to your email address.
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
                            <div className="pt-2">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Resending...' : 'Resend Verification Email'}
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="mt-8 text-center">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="font-medium text-red-600 hover:text-red-500 hover:underline text-sm"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}