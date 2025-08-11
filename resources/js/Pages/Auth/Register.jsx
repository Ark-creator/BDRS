import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

// --- REUSABLE COMPONENTS (Consistent with Login Page) ---

const AuthLayout = ({ title, description }) => (
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url('/images/brgy.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-800/90"></div>
        <div className="relative z-10">
            <div className="flex items-center mb-8">
                <div className="w-16 h-16 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 p-2 shadow-lg">
                   <img src="/images/gapanlogo.png" alt="Barangay Logo" className="w-full h-full" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-shadow">{title}</h1>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed text-shadow-sm">{description}</p>
            <p className="text-xs text-blue-200 mt-12 opacity-75">Gapan City, Nueva Ecija</p>
        </div>
    </div>
);

const CustomTextInput = ({ icon, className = '', ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
        </div>
        <input 
            {...props}
            className={`w-full pl-12 pr-4 py-3 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white ${className}`}
        />
    </div>
);

const CustomSelect = ({ icon, children, ...props }) => (
     <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
        </div>
        <select
            {...props}
            className="w-full pl-12 pr-10 py-3 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white appearance-none"
        >
            {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);


const PrimaryButton = ({ className = '', disabled, children, ...props }) => (
    <button
        {...props}
        className={
            `w-full group flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg font-semibold text-base text-white tracking-widest hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ease-in-out duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                disabled && 'opacity-50 cursor-not-allowed'
            } ` + className
        }
        disabled={disabled}
    >
        {children}
    </button>
);

// --- ICONS ---
const UserIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const HomeIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const PhoneIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
const CalendarIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const GenderIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m-4-12h8m-8 4h8m-8 4h8"></path></svg>; // Placeholder
const StatusIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>;
const MailIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
const LockIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>;
const EyeOpenIcon = () => <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const EyeClosedIcon = () => <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>;


export default function Register() {
    const [step, setStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        address: '',
        phone_number: '',
        birthday: '',
        gender: '',
        civil_status: '',
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

    const nextStep = () => {
        // Add validation for step 1 fields here if desired
        setStep(2);
    };

    const prevStep = () => {
        setStep(1);
    };

    return (
        <div className="bg-gradient-to-br from-sky-50 to-slate-200">
            <Head title="Register | Brgy. San Lorenzo" />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">
                    
                    <AuthLayout 
                        title="Brgy. San Lorenzo"
                        description="Join our community portal. Register for an account to access barangay services, announcements, and more."
                    />

                    {/* Right Side: Registration Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
                        <div className="flex justify-center mb-6">
                            <img src="/images/gapanlogo.png" alt="Barangay Logo" className="h-16 w-16" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">Create Your Account</h2>
                        <p className="text-slate-500 mb-6 text-center">Let's get you started.</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-8">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                        </div>

                        <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(95vh - 250px)' }}>
                            <form onSubmit={submit} className="space-y-6">
                                {step === 1 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Personal Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="first_name" className="font-medium text-slate-700 text-sm mb-2 block">First Name</label>
                                                <CustomTextInput id="first_name" icon={<UserIcon />} value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} required />
                                                <InputError message={errors.first_name} className="mt-2" />
                                            </div>
                                            <div>
                                                <label htmlFor="last_name" className="font-medium text-slate-700 text-sm mb-2 block">Last Name</label>
                                                <CustomTextInput id="last_name" icon={<UserIcon />} value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} required />
                                                <InputError message={errors.last_name} className="mt-2" />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="middle_name" className="font-medium text-slate-700 text-sm mb-2 block">Middle Name <span className="text-slate-400">(Optional)</span></label>
                                            <CustomTextInput id="middle_name" icon={<UserIcon />} value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label htmlFor="address" className="font-medium text-slate-700 text-sm mb-2 block">Full Address</label>
                                            <CustomTextInput id="address" icon={<HomeIcon />} value={data.address} onChange={(e) => setData('address', e.target.value)} required />
                                            <InputError message={errors.address} className="mt-2" />
                                        </div>
                                        <div>
                                            <label htmlFor="phone_number" className="font-medium text-slate-700 text-sm mb-2 block">Phone Number</label>
                                            <CustomTextInput id="phone_number" type="tel" icon={<PhoneIcon />} value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} />
                                            <InputError message={errors.phone_number} className="mt-2" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="birthday" className="font-medium text-slate-700 text-sm mb-2 block">Birthday</label>
                                                <CustomTextInput id="birthday" type="date" icon={<CalendarIcon />} value={data.birthday} onChange={(e) => setData('birthday', e.target.value)} className="pr-2"/>
                                                <InputError message={errors.birthday} className="mt-2" />
                                            </div>
                                            <div>
                                                <label htmlFor="gender" className="font-medium text-slate-700 text-sm mb-2 block">Gender</label>
                                                <CustomSelect id="gender" icon={<GenderIcon />} value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                                                    <option value="">Select...</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </CustomSelect>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="civil_status" className="font-medium text-slate-700 text-sm mb-2 block">Civil Status</label>
                                            <CustomSelect id="civil_status" icon={<StatusIcon />} value={data.civil_status} onChange={(e) => setData('civil_status', e.target.value)}>
                                                <option value="">Select...</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Widowed">Widowed</option>
                                                <option value="Separated">Separated</option>
                                            </CustomSelect>
                                        </div>
                                        <div className="pt-2">
                                            <PrimaryButton type="button" onClick={nextStep}>Next Step</PrimaryButton>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Account Details</h3>
                                        <div>
                                            <label htmlFor="email" className="font-medium text-slate-700 text-sm mb-2 block">Email Address</label>
                                            <CustomTextInput id="email" type="email" icon={<MailIcon />} value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="password" className="font-medium text-slate-700 text-sm mb-2 block">Password</label>
                                            <CustomTextInput id="password" type={passwordVisible ? 'text' : 'password'} icon={<LockIcon />} value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                                            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-8 pr-4 flex items-center text-sm z-10">
                                                {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                            </button>
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>
                                        <div className="relative">
                                            <label htmlFor="password_confirmation" className="font-medium text-slate-700 text-sm mb-2 block">Confirm Password</label>
                                            <CustomTextInput id="password_confirmation" type={confirmPasswordVisible ? 'text' : 'password'} icon={<LockIcon />} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                                            <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 top-8 pr-4 flex items-center text-sm z-10">
                                                {confirmPasswordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                            </button>
                                        </div>
                                        <div className="flex gap-4 pt-2">
                                            <button type="button" onClick={prevStep} className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors">Back</button>
                                            <PrimaryButton type="submit" disabled={processing}>
                                                {processing ? 'Creating Account...' : 'Create Account'}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="mt-auto pt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
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
