import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

// Reusable components (can be moved to their own files later)
const EyeOpenIcon = () => (
    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
);

const EyeClosedIcon = () => (
    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
);


export default function Login({ status, canResetPassword }) {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="bg-gray-50">
            <Head title="Log in | Brgy. San Ildefonso" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden md:flex">
                    
                    {/* Left Side: Branding (Copied from Register.jsx) */}
                    <div className="w-full md:w-1/2 bg-blue-600 text-white p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center mb-4">
                            <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                            <h1 className="text-2xl font-bold">Brgy. San Ildefonso</h1>
                        </div>
                        <p className="text-blue-100 mt-4">Welcome back! Please log in to your account to continue.</p>
                        <p className="text-xs text-blue-200 mt-8 opacity-75">Cabanatuan City, Nueva Ecija</p>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign In</h2>
                        <p className="text-gray-500 mb-6">Welcome back to the portal.</p>

                        {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <InputLabel htmlFor="email" value="Email Address" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mb-4 relative">
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                                    {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                </button>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-between mt-6">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span className="ms-2 text-sm text-gray-600">Remember me</span>
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            <div className="mt-6">
                                <PrimaryButton className="w-full flex justify-center py-3" disabled={processing}>
                                    {processing ? 'Signing In...' : 'Sign In'}
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href={route('register')} className="font-medium text-blue-600 hover:text-blue-500">
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}