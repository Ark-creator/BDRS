import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

// Reusable InputError component for displaying validation errors
function InputError({ message, className = '' }) {
    return message ? <p className={'text-sm text-red-600 ' + className}>{message}</p> : null;
}

// Reusable TextInput component
function TextInput({ type = 'text', className = '', ...props }) {
    return (
        <input
            {...props}
            type={type}
            className={
                'form-input mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ' +
                className
            }
        />
    );
}

// Reusable InputLabel component
function InputLabel({ forInput, value, className = '', children }) {
    return (
        <label htmlFor={forInput} className={`block text-sm font-medium text-gray-700 ` + className}>
            {value ? <span>{value}</span> : <span>{children}</span>}
        </label>
    );
}

// Eye icons for password toggle
const EyeOpenIcon = () => (
    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
);

const EyeClosedIcon = () => (
    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
);


export default function Register() {
    // State for password visibility toggle
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Inertia's useForm hook with all the new fields
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        address: '',
        phone_number: '',
        birthday: '',
        gender: '',
        civil_status: '',
        profile_picture_url: '', // Keeping as text input for now
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="bg-gray-50">
            <Head title="Register | Brgy. San Ildefonso" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden md:flex">
                    
                    {/* Left Side: Branding */}
                    <div className="w-full md:w-1/2 bg-blue-600 text-white p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center mb-4">
                            <svg className="w-10 h-10 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                            <h1 className="text-2xl font-bold">Brgy. San Ildefonso</h1>
                        </div>
                        <p className="text-blue-100 mt-4">Welcome to our community portal. Register for an account to access barangay services, announcements, and more.</p>
                        <p className="text-xs text-blue-200 mt-8 opacity-75">Cabanatuan City, Nueva Ecija</p>
                    </div>

                    {/* Right Side: Registration Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Your Account</h2>
                        <p className="text-gray-500 mb-6">Let's get you started.</p>

                        <form onSubmit={submit}>
                            {/* --- Name Fields --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <InputLabel forInput="first_name" value="First Name" />
                                    <TextInput id="first_name" name="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} required />
                                    <InputError message={errors.first_name} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel forInput="last_name" value="Last Name" />
                                    <TextInput id="last_name" name="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} required />
                                    <InputError message={errors.last_name} className="mt-2" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <InputLabel forInput="middle_name">Middle Name <span className="text-gray-400">(Optional)</span></InputLabel>
                                <TextInput id="middle_name" name="middle_name" value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} />
                                <InputError message={errors.middle_name} className="mt-2" />
                            </div>

                            {/* --- NEW PROFILE FIELDS --- */}
                            <div className="mb-4">
                                <InputLabel forInput="address" value="Full Address" />
                                <TextInput id="address" name="address" value={data.address} onChange={(e) => setData('address', e.target.value)} required />
                                <InputError message={errors.address} className="mt-2" />
                            </div>

                            <div className="mb-4">
                                <InputLabel forInput="phone_number" value="Phone Number" />
                                <TextInput id="phone_number" type="tel" name="phone_number" value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} />
                                <InputError message={errors.phone_number} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <InputLabel forInput="birthday" value="Birthday" />
                                    <TextInput id="birthday" type="date" name="birthday" value={data.birthday} onChange={(e) => setData('birthday', e.target.value)} />
                                    <InputError message={errors.birthday} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel forInput="gender" value="Gender" />
                                    <select id="gender" name="gender" value={data.gender} className="form-input mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={(e) => setData('gender', e.target.value)}>
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <InputError message={errors.gender} className="mt-2" />
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <InputLabel forInput="civil_status" value="Civil Status" />
                                <select id="civil_status" name="civil_status" value={data.civil_status} className="form-input mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" onChange={(e) => setData('civil_status', e.target.value)}>
                                    <option value="">Select...</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Separated">Separated</option>
                                </select>
                                <InputError message={errors.civil_status} className="mt-2" />
                            </div>
                            
                            {/* --- AUTHENTICATION FIELDS --- */}
                             <hr className="my-6" />

                            <div className="mb-4">
                                <InputLabel forInput="email" value="Email Address" />
                                <TextInput id="email" type="email" name="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mb-4 relative">
                                <InputLabel forInput="password" value="Password" />
                                <TextInput id="password" type={passwordVisible ? 'text' : 'password'} name="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                                    {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                </button>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel forInput="password_confirmation" value="Confirm Password" />
                                <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>

                            <div>
                                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out" disabled={processing}>
                                    {processing ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href={route('login')} className="font-medium text-blue-600 hover:text-blue-500">
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