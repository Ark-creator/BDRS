import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

const AuthLayout = ({ title, description, logoUrl }) => (
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url('/images/brgy.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-800/90"></div>
        <div className="relative z-10">
            <div className="flex items-center mb-8">
                <div className="w-20 h-20 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 p-2 shadow-lg">
                 
                    <img src={logoUrl || "/images/gapanlogo.png"} alt="Website Logo" className="w-full h-full rounded-full" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-shadow">{title}</h1>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed text-shadow-sm">{description}</p>
        </div>
    </div>
);

const CustomTextInput = ({ icon, className = '', error, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            className={`w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white ${
                error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/50'
            } ${className}`}
        />
    </div>
);

const PrimaryButton = ({ className = '', disabled, children, ...props }) => (
    <button
        {...props}
        className={
            `w-full group flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg font-semibold text-base text-white tracking-widest hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ease-in-out duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                disabled && 'opacity-75 cursor-not-allowed'
            } ` + className
        }
        disabled={disabled}
    >
        {disabled ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
            </>
        ) : (
            children
        )}
    </button>
);

const MailIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;


export default function ForgotPassword({ status, footerData }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="bg-gradient-to-br from-sky-50 to-slate-200">
            <Head title="Forgot Password" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">

                    <AuthLayout
                        logoUrl={footerData?.footer_logo_url} 
                        title="Reset Your Password"
                        description="Don't worry, it happens. Enter the email address associated with your account, and we'll send you a link to choose a new password."
                    />

                    <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Your Password?</h2>
                        <p className="text-slate-500 mb-6">Let's get you back on track.</p>

                       
                        {status && (
                            <div className="mb-4 flex items-center gap-3 rounded-md bg-green-50 p-4 text-sm font-medium text-green-800 ring-1 ring-inset ring-green-200">
                                <CheckCircleIcon />
                                <span>{status}</span>
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-4">
                            <div>
                                <label htmlFor="email" className="font-medium text-slate-700 text-sm mb-2 block">Email Address</label>
                                <CustomTextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    icon={<MailIcon />}
                                    value={data.email}
                                    autoFocus
                                    onChange={(e) => setData('email', e.target.value)}
                                    error={errors.email}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mt-6">
                                <PrimaryButton disabled={processing}>
                                    Email Password Reset Link
                                </PrimaryButton>
                            </div>
                        </form>

                        {/* --- Back to Login Link --- */}
                        <div className="mt-auto pt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Remember your password?{' '}
                                <Link href={route('login')} className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                    Sign in here
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}