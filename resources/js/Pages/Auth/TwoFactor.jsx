import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

// 1. Copying the shared layout component from Login.jsx
const AuthLayout = ({ title, description, children }) => (
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url(/images/brgy.png"}}>
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

// 2. Copying the custom text input component
const CustomTextInput = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            className="w-full pl-10 pr-4 py-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
        />
    </div>
);

// 3. Copying the required icon
const LockIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>;

// 4. Copying the primary button
const PrimaryButton = ({ className = '', disabled, children, ...props }) => (
    <button
        {...props}
        className={
            `w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg font-semibold text-base text-white tracking-widest hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ease-in-out duration-150 ${
                disabled && 'opacity-50 cursor-not-allowed'
            } ` + className
        }
        disabled={disabled}
    >
        {children}
    </button>
);


// 5. The main TwoFactor component
export default function TwoFactor() {
    const { data, setData, post, processing, errors } = useForm({
        two_factor_code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('two_factor.verify'));
    };

    return (
        <div className="bg-sky-50">
            <Head title="Two-Factor Verification" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">

                    <AuthLayout
                        title="Two-Factor Authentication"
                        description="A one-time code has been sent to your email address. Please enter it below to complete your login."
                    />

                    {/* Right Side: 2FA Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Enter Your Code</h2>
                        <p className="text-slate-500 mb-8">
                            Please check your email and enter the 6-digit code.
                        </p>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label htmlFor="two_factor_code" className="font-medium text-slate-700 text-sm mb-2 block">
                                    Verification Code
                                </label>
                                <CustomTextInput
                                    id="two_factor_code"
                                    type="text"
                                    name="two_factor_code"
                                    value={data.two_factor_code}
                                    onChange={(e) => setData('two_factor_code', e.target.value)}
                                    icon={<LockIcon />}
                                    placeholder="••••••"
                                    required
                                    maxLength="6"
                                />
                                <InputError message={errors.two_factor_code} className="mt-2" />
                            </div>

                            <div className="pt-2">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Verifying...' : 'Verify Code'}
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