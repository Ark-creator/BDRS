import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import axios from 'axios';
import { validateRegistrationImageWasm } from '@/Services/identityWasmValidator';
import { analyzeImageData, clamp } from '@/IdentityVerification/imageAnalysisCore';

// --- HELPER & UI COMPONENTS ---
const CloseIcon = () => ( <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> );
const TermsModal = ({ isOpen, onClose, children }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true" aria-labelledby="modal-title" > <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"> <div className="flex justify-between items-center p-4 border-b shrink-0"> <h2 id="modal-title" className="text-xl font-semibold text-slate-800">Terms and Conditions</h2> <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" aria-label="Close" > <CloseIcon /> </button> </div> <div className="p-6 overflow-y-auto"> {children} </div> <div className="p-4 border-t bg-slate-50 text-right shrink-0 rounded-b-lg"> <PrimaryButton onClick={onClose} className="w-auto px-8 !py-2 !text-sm"> I Understand </PrimaryButton> </div> </div> </div> ); };
const TermsAndConditionsContent = () => ( <div className="prose prose-sm max-w-none text-slate-600"> <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p> <p>Welcome to the Barangay San Lorenzo Document Request System. By creating an account and using this service, you agree to comply with and be bound by the following terms and conditions of use.</p> <br /> <h4>1. Acceptance of Terms</h4> <p>This service is provided to the residents of Barangay San Lorenzo, Gapan City, for the purpose of requesting official barangay documents online. By accessing or using the service, you agree to these Terms and Conditions and our Privacy Policy.</p> <br /> <h4>2. User Account and Responsibilities</h4> <ul> <li>You must be a legitimate resident of Barangay San Lorenzo to create an account.</li> <li>You are responsible for providing accurate, current, and complete information during the registration process. Any falsification of information may lead to the suspension of your account and legal action.</li> <li>You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.</li> </ul> <br /> <h4>3. Document Request Process</h4> <ul> <li>All document requests are subject to verification and approval by authorized barangay personnel.</li> <li>The processing times for document requests are estimates and are not guaranteed.</li> <li>Fees may apply for certain documents. You will be notified of any applicable fees before your request is finalized. All payments must be settled through the official channels specified by the barangay.</li> <li>The collection of documents must be done in person at the barangay hall unless another delivery method is specified and approved. You must present a valid ID upon collection.</li> </ul> <br /> <h4>4. Data Privacy</h4> <p>We are committed to protecting your privacy in accordance with the Data Privacy Act of 2012 (R.A. 10173) of the Philippines. The personal information you provide will be used exclusively for processing your document requests and for official communication. Your data will not be shared with third parties without your explicit consent, except as required by law.</p> <br /> <h4>5. Prohibited Conduct</h4> <p>You agree not to use this service for any unlawful purpose, including but not limited to submitting fraudulent requests, attempting to access unauthorized data, or disrupting the service's operations.</p> <br /> <h4>6. Disclaimer</h4> <p>This service is provided "as is" without any warranties. The Barangay does not guarantee that the service will be error-free or uninterrupted. The accuracy of the information you provide is your sole responsibility.</p> <br /> <h4>7. Limitation of Liability</h4> <p>You understand and agree that your use of this system is at your own risk. While the Barangay and its developers implement reasonable security measures to protect your information, we cannot guarantee absolute security against all potential threats such as sophisticated cyber-attacks. The internet is not a completely secure environment.</p> <p>To the fullest extent permitted by law, **Barangay San Lorenzo, its officials, employees, and the system developers shall not be liable** for any direct, indirect, incidental, or consequential damages, including but not limited to data loss, unauthorized access, or information leaks resulting from security breaches or system failures beyond our reasonable control. By using this service, you agree to hold the Barangay and its developers harmless from any claims arising from such incidents.</p> <br /> <h4>8. Changes to Terms</h4> <p>Barangay San Lorenzo reserves the right to modify these terms and conditions at any time. We will notify you of any changes by posting the new terms on this site. Your continued use of the service after any such changes constitutes your acceptance of the new terms.</p> <br /> <h4>9. Contact Information</h4> <p>If you have any questions about these Terms and Conditions, please contact the Barangay Hall directly.</p> </div> );
const CustomTextInput = ({ icon, className = '', error, ...props }) => ( <div className="relative"> <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> {icon} </div> <input {...props} className={`w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white ${ error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/50' } ${className}`} /> </div> );
const CustomSelect = ({ icon, children, error, className = '', ...props }) => ( <div className="relative"> <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> {icon} </div> <select {...props} className={`w-full pl-12 pr-10 py-3 border rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white appearance-none ${ error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/50'} ${className}`}> {children} </select> <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"> <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg> </div> </div> );
const PrimaryButton = ({ className = '', disabled, children, ...props }) => ( <button {...props} className={ `w-full group flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg font-semibold text-base text-white tracking-widest hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ease-in-out duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${ disabled && 'opacity-50 cursor-not-allowed' } ` + className } disabled={disabled} > {children} </button> );
const SecondaryButton = ({ className = '', disabled, children, ...props }) => ( <button {...props} type="button" className={ `w-full flex justify-center py-3 px-4 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${ disabled && 'opacity-50 cursor-not-allowed' } ` + className } disabled={disabled} > {children} </button> );
const UserIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const HomeIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const PhoneIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
const CalendarIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const GenderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 14.25v-2.25a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v2.25m-6 0h6m-3-10.5v1.5m0 0v1.5m0-1.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM15 9.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM17.25 12v4.5m0 0v1.5m0-1.5h-1.5m1.5 0h1.5" /></svg>;
const StatusIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>;
const MailIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
const LockIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>;
const EyeOpenIcon = () => <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
const EyeClosedIcon = () => <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>;
const CheckIcon = () => <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const CrossIcon = () => <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const MapPinIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const getPasswordValidationState = (password) => { const hasUpperCase = /[A-Z]/.test(password); const hasLowerCase = /[a-z]/.test(password); const hasNumber = /[0-9]/.test(password); const hasSpecialChar = /[^A-Za-z0-9]/.test(password); const hasValidLength = password.length >= 8 && password.length <= 16; const checks = { 'Uppercase letter': hasUpperCase, 'Lowercase letter': hasLowerCase, 'Number': hasNumber, 'Special character': hasSpecialChar, '8-16 characters': hasValidLength, }; const strength = Object.values(checks).filter(Boolean).length; const isValid = strength === 5; return { strength, checks, isValid }; };
const PasswordStrengthIndicator = ({ password }) => { const { strength, checks } = useMemo(() => getPasswordValidationState(password), [password]); if (!password) return null; const strengthColors = [ 'bg-slate-200', 'bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-green-500' ]; return ( <div className="mt-3 space-y-2 p-3 bg-slate-50/75 rounded-lg border border-slate-200"> <div className="flex items-center gap-3"> <p className="text-sm font-medium text-slate-600 shrink-0">Strength:</p> <div className="w-full bg-slate-200 rounded-full h-2.5"> <div className={`h-2.5 rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${(strength / 5) * 100}%` }}></div> </div> </div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1"> {Object.entries(checks).map(([requirement, isMet]) => ( <div key={requirement} className="flex items-center gap-2"> {isMet ? <CheckIcon /> : <CrossIcon />} <span className={`text-xs ${isMet ? 'text-slate-700' : 'text-slate-500'}`}>{requirement}</span> </div> ))} </div> </div> ); };
const ValidationIndicator = ({ status }) => { const iconContainer = "absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"; if (status === 'checking') { return ( <div className={iconContainer}> <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> </div> ); } if (status === 'valid') { return ( <div className={iconContainer}> <CheckIcon /> </div> ); } if (status === 'invalid') { return ( <div className={iconContainer}> <CrossIcon /> </div> ); } return null; };
const IdPrecheckMessage = ({ validation }) => {
    if (!validation || validation.status === 'idle') return null;
    const styles = {
        checking: 'border-blue-200 bg-blue-50 text-blue-700',
        valid: 'border-green-200 bg-green-50 text-green-700',
        invalid: 'border-red-200 bg-red-50 text-red-700',
        unchecked: 'border-amber-200 bg-amber-50 text-amber-700',
    };
    return (
        <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium ${styles[validation.status] || styles.unchecked}`}>
            {validation.status === 'checking' ? (
                <svg className="mt-0.5 h-4 w-4 shrink-0 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : validation.status === 'valid' ? (
                <CheckIcon />
            ) : validation.status === 'unchecked' ? (
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            ) : (
                <CrossIcon />
            )}
            <span>
                {validation.message}
                {Number.isFinite(validation.confidence ?? validation.score) && (
                    <span className="ml-2 font-semibold">{Math.round(validation.confidence ?? validation.score)}%</span>
                )}
            </span>
        </div>
    );
};
const CameraIcon = () => <svg className="h-5 w-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const IdCardIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-9 4h2m-2 4h4m6-4v4m-2-2h4"></path></svg>;
const GalleryIcon = () => <svg className="h-5 w-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const AIProcessingIcon = () => <svg className="h-5 w-5 inline-block mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;


const AuthLayout = ({ title, mainTitle, description, logoUrl }) => (
    <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url('/images/brgy.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-800/90"></div>
        <div className="relative z-10">
            <div className="flex items-center mb-8">
                 <div className="w-20 h-20 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 shrink-0">
                    <img className="rounded-full p-2" src={logoUrl || '/images/gapanlogo.png'} alt="Website Logo" />
                </div>
                <div>
                    {/* Ang h1 ay para sa subtitle */}
                    <h1 className="text-3xl font-bold tracking-tight text-shadow">{title}</h1>
                </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed text-shadow-sm">{description}</p>
            {/* Ang main title (footer_title) ay nasa baba */}
            <p className="text-xs text-blue-200 mt-12 opacity-75">{mainTitle}</p>
        </div>
    </div>
);

// --- CAMERA MODAL COMPONENT ---
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sampleVideoFrame = (video, facingMode, sampleSize = 48) => {
    if (!video?.videoWidth || !video?.videoHeight) return null;

    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (facingMode === 'user') {
        context.translate(sampleSize, 0);
        context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, sampleSize, sampleSize);
    const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
    const grayscale = new Uint8Array(sampleSize * sampleSize);

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        grayscale[p] = Math.round((0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]));
    }

    return grayscale;
};

const motionBetweenFrames = (first, second) => {
    if (!first || !second || first.length !== second.length) return null;
    let total = 0;
    for (let i = 0; i < first.length; i += 1) {
        total += Math.abs(first[i] - second[i]);
    }
    return Number((total / (first.length * 255)).toFixed(4));
};

const createCaptureMetadata = async (video, facingMode) => {
    const firstFrame = sampleVideoFrame(video, facingMode);
    await wait(140);
    const secondFrame = sampleVideoFrame(video, facingMode);
    return {
        source: 'camera',
        captured_at: new Date().toISOString(),
        motion_score: motionBetweenFrames(firstFrame, secondFrame),
        video_width: video.videoWidth,
        video_height: video.videoHeight,
        facing_mode: facingMode,
    };
};

const ID_TARGET_ASPECT_RATIO = 1.586;
const ID_STEADY_FRAME_TARGET = 15;
const ID_READY_MIN_AREA = 0.65;
const ID_READY_MAX_AREA = 0.95;
const ID_ROLLING_BUFFER_MS = 500;
const ID_AUTO_TIMEOUT_MS = 30000;

const analyzeLiveCameraFrame = (video, facingMode, captureTarget) => {
    if (!video?.videoWidth || !video?.videoHeight) return null;

    const maxSide = captureTarget === 'face' ? 260 : 360;
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const sampleWidth = Math.max(1, Math.round(sourceWidth * scale));
    const sampleHeight = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'medium';

    if (facingMode === 'user') {
        context.translate(sampleWidth, 0);
        context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

    return analyzeImageData({
        data,
        sampleWidth,
        sampleHeight,
        width: sourceWidth,
        height: sourceHeight,
        fileSize: 0,
        role: captureTarget === 'face' ? 'selfie' : 'front_id',
        captureMetadata: { source: 'camera', motion_score: null },
    });
};

const frameDistance = (first, second) => {
    if (!first || !second) return Infinity;
    return Math.hypot(first.x - second.x, first.y - second.y);
};

const smoothQuadrilateral = (previous, next, alpha = 0.38) => {
    if (!previous || !next || previous.length !== next.length) return next;

    return next.map((point, index) => ({
        ...point,
        x: roundForUi((previous[index].x * (1 - alpha)) + (point.x * alpha)),
        y: roundForUi((previous[index].y * (1 - alpha)) + (point.y * alpha)),
        nx: point.nx,
        ny: point.ny,
    }));
};

const roundForUi = (value) => Math.round(value * 10) / 10;

const updateTrackedAnalysis = (analysis, tracker) => {
    if (!analysis?.geometry) return analysis;

    const now = performance.now();
    const geometry = analysis.geometry;
    const previousGood = tracker.lastGoodGeometry;

    if (geometry.boundary_detected && geometry.quadrilateral) {
        const smoothedQuadrilateral = smoothQuadrilateral(previousGood?.quadrilateral, geometry.quadrilateral);
        const smoothedCentroid = smoothedQuadrilateral.reduce((total, point) => ({
            x: total.x + point.x,
            y: total.y + point.y,
        }), { x: 0, y: 0 });
        smoothedCentroid.x = roundForUi(smoothedCentroid.x / smoothedQuadrilateral.length);
        smoothedCentroid.y = roundForUi(smoothedCentroid.y / smoothedQuadrilateral.length);

        const trackedGeometry = {
            ...geometry,
            quadrilateral: smoothedQuadrilateral,
            centroid: {
                ...geometry.centroid,
                x: smoothedCentroid.x,
                y: smoothedCentroid.y,
            },
            tracking_prediction: false,
        };

        tracker.lastGoodGeometry = trackedGeometry;
        tracker.lastGoodAt = now;
        return { ...analysis, geometry: trackedGeometry };
    }

    if (previousGood && now - (tracker.lastGoodAt || 0) < 450) {
        return {
            ...analysis,
            geometry: {
                ...previousGood,
                boundary_detected: true,
                tracking_prediction: true,
                boundary_score: Math.min(previousGood.boundary_score || 0, 64),
                edge_confidence: Math.min(previousGood.edge_confidence || 0, 70),
                corner_confidence: Math.min(previousGood.corner_confidence || 0, 70),
                detection_reason: 'tracking_prediction',
            },
        };
    }

    return analysis;
};

const sideHintFromMargins = (margins) => {
    if (!margins) return null;
    const entries = Object.entries(margins);
    const [side, value] = entries.reduce((lowest, current) => current[1] < lowest[1] ? current : lowest, entries[0]);
    if (value >= 0.035) return null;
    const direction = {
        left: 'right',
        right: 'left',
        top: 'down',
        bottom: 'up',
    }[side];

    return { side, direction };
};

const updateStability = (analysis, tracker) => {
    const centroid = analysis?.geometry?.centroid;
    if (!centroid || analysis?.geometry?.tracking_prediction || !analysis?.geometry?.boundary_detected) {
        tracker.steadyFrames = 0;
        tracker.lastCentroid = centroid || null;
        return { steadyFrames: 0, centroidMovement: null };
    }

    const movement = frameDistance(centroid, tracker.lastCentroid);
    tracker.steadyFrames = Number.isFinite(movement) && movement < 5
        ? Math.min(ID_STEADY_FRAME_TARGET, (tracker.steadyFrames || 0) + 1)
        : 0;
    tracker.lastCentroid = centroid;

    return {
        steadyFrames: tracker.steadyFrames,
        centroidMovement: Number.isFinite(movement) ? roundForUi(movement) : null,
    };
};

const smartReadinessFromAnalysis = (analysis, captureTarget, tracking = {}) => {
    if (!analysis) {
        return {
            score: 0,
            ready: false,
            state: 'detecting',
            message: captureTarget === 'face' ? 'Finding face' : 'Finding ID',
            analysis: null,
            sideHint: null,
            steadyFrames: 0,
        };
    }

    const quality = analysis.quality || {};
    const geometry = analysis.geometry || {};
    const blockingIssues = quality.blocking_issues || [];
    let score = quality.score || 0;
    let message = 'Hold steady';
    let state = 'adjust';

    if (captureTarget !== 'face') {
        const boundaryScore = geometry.boundary_score || 0;
        const edgeScore = (geometry.edge_completeness || 0) * 100;
        const edgeConfidence = geometry.edge_confidence || 0;
        const cornerConfidence = geometry.corner_confidence || 0;
        const rotation = Math.abs(geometry.document_rotation_degrees || 0);
        const perspective = geometry.perspective_skew || 0;
        const areaRatio = geometry.document_area_ratio || 0;
        const aspectRatio = geometry.document_aspect_ratio || 0;
        const margins = geometry.margins || {};
        const sideHint = sideHintFromMargins(margins);
        const centered = Math.min(
            margins.left ?? 0,
            margins.right ?? 0,
            margins.top ?? 0,
            margins.bottom ?? 0
        ) >= 0.035;
        const steadyFrames = tracking.steadyFrames || 0;
        const sharpnessThreshold = tracking.sharpnessThreshold || 45;
        const sharpEnough = (quality.laplacian_variance || 0) >= sharpnessThreshold;
        const aspectValid = aspectRatio > 0 && Math.abs(aspectRatio - ID_TARGET_ASPECT_RATIO) / ID_TARGET_ASPECT_RATIO <= 0.05;
        const completeEdges = geometry.boundary_detected
            && geometry.corners_inside
            && (geometry.missing_edges || []).length === 0
            && edgeConfidence >= 92
            && cornerConfidence >= 92;
        const glareOk = (quality.glare_ratio || 0) <= 0.10;
        const sizeReady = areaRatio >= ID_READY_MIN_AREA && areaRatio <= ID_READY_MAX_AREA;
        const stableReady = steadyFrames >= ID_STEADY_FRAME_TARGET;

        score = Math.round(clamp(
            (quality.score * 0.24)
            + (boundaryScore * 0.24)
            + (edgeScore * 0.16)
            + (edgeConfidence * 0.18)
            + (cornerConfidence * 0.10)
            + (Math.min(steadyFrames / ID_STEADY_FRAME_TARGET, 1) * 100 * 0.08),
            0,
            100
        ));

        if (tracking.timedOut) {
            score = Math.min(score, 52);
            message = 'Try better lighting';
            state = 'timeout';
        } else if (!geometry.boundary_detected || geometry.tracking_prediction) {
            score = Math.min(score, geometry.tracking_prediction ? 62 : 48);
            message = geometry.tracking_prediction ? 'Hold card visible' : 'Show the whole card - edges incomplete';
            state = 'detecting';
        } else if (!completeEdges) {
            score = Math.min(score, 68);
            message = 'Show the whole card - edges incomplete';
        } else if (!centered || geometry.cropped_risk === 'high') {
            score = Math.min(score, 68);
            message = sideHint ? `Move ID ${sideHint.direction}` : 'Move ID fully inside';
        } else if (!aspectValid) {
            score = Math.min(score, 72);
            message = 'Flatten the card';
        } else if (areaRatio < ID_READY_MIN_AREA) {
            score = Math.min(score, 74);
            message = 'Move closer';
        } else if (areaRatio > ID_READY_MAX_AREA) {
            score = Math.min(score, 74);
            message = 'Move back slightly';
        } else if (rotation > 16) {
            score = Math.min(score, 76);
            message = 'Straighten the ID';
        } else if (perspective > 0.22) {
            score = Math.min(score, 76);
            message = 'Reduce tilt';
        } else if (blockingIssues.includes('image_blurry') || !sharpEnough) {
            score = Math.min(score, 70);
            message = 'Hold steady';
        } else if (blockingIssues.includes('image_too_dark')) {
            score = Math.min(score, 70);
            message = 'Add more light';
        } else if (blockingIssues.includes('id_glare_detected')) {
            score = Math.min(score, 72);
            message = 'Tilt to remove glare';
        } else if (!glareOk) {
            score = Math.min(score, 72);
            message = 'Tilt to remove glare';
        } else if (!stableReady) {
            score = Math.min(score, 86);
            message = `Hold still ${steadyFrames}/${ID_STEADY_FRAME_TARGET}`;
            state = 'near';
        } else if (score >= 92) {
            message = 'Captured!';
            state = 'ready';
        } else {
            message = 'Hold still';
            state = score >= 78 ? 'near' : 'adjust';
        }

        return {
            score,
            ready: state === 'ready'
                && blockingIssues.length === 0
                && completeEdges
                && sizeReady
                && stableReady
                && sharpEnough
                && glareOk
                && aspectValid,
            state,
            message,
            analysis,
            sideHint,
            steadyFrames,
            centroidMovement: tracking.centroidMovement ?? null,
            sharpnessThreshold,
        };
    }

    if (blockingIssues.includes('image_blurry')) {
        score = Math.min(score, 70);
        message = 'Hold still';
    } else if (blockingIssues.includes('image_too_dark')) {
        score = Math.min(score, 70);
        message = 'Add more light';
    } else if (quality.issues?.includes('selfie_glare_detected')) {
        score = Math.min(score, 76);
        message = 'Avoid glare';
    } else if (score >= 78) {
        message = 'Ready';
        state = 'ready';
    } else {
        message = 'Center your face';
    }

    return {
        score,
        ready: state === 'ready' && blockingIssues.length === 0,
        state,
        message,
        analysis,
        sideHint: null,
        steadyFrames: 0,
    };
};

const drawVideoFrameToCanvas = (video, facingMode, maxWidth, maxHeight) => {
    if (!video?.videoWidth || !video?.videoHeight) return null;

    const scale = Math.min(1, maxWidth / video.videoWidth, maxHeight / video.videoHeight);
    const width = Math.max(1, Math.round(video.videoWidth * scale));
    const height = Math.max(1, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    if (facingMode === 'user') {
        context.translate(width, 0);
        context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);
    return canvas;
};

const qualityRankForFrame = (readiness) => {
    const quality = readiness?.analysis?.quality || {};
    return (readiness?.score || 0)
        + ((quality.laplacian_variance || 0) * 0.012)
        - ((quality.glare_ratio || 0) * 160);
};

const CaptureGuideOverlay = ({ captureTarget, streamReady, readiness }) => {
    const isFace = captureTarget === 'face';
    const guideStyle = isFace
        ? { width: 'min(54vw, 260px)', height: 'min(62vh, 340px)' }
        : { width: 'min(90%, 720px)', aspectRatio: '1.586 / 1' };
    const helper = readiness?.message || (isFace ? 'Center your face' : 'Show the ID edges');
    const score = Math.round(readiness?.score || 0);
    const ready = readiness?.ready;
    const guideColor = ready ? 'border-emerald-300 shadow-[0_0_32px_rgba(16,185,129,0.28)]' : streamReady ? 'border-sky-300 shadow-[0_0_28px_rgba(56,189,248,0.20)]' : 'border-white/70';
    const sideHint = readiness?.sideHint;
    const edgeHintPosition = {
        left: 'left-4 top-1/2 -translate-y-1/2',
        right: 'right-4 top-1/2 -translate-y-1/2',
        top: 'left-1/2 top-16 -translate-x-1/2',
        bottom: 'bottom-16 left-1/2 -translate-x-1/2',
    }[sideHint?.side];
    const edgeHintArrow = {
        left: '>',
        right: '<',
        top: 'v',
        bottom: '^',
    }[sideHint?.side];

    if (isFace) {
        return <AIFaceScanner readiness={readiness} />;
    }

    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-950/20"></div>
            <AIIdBorder readiness={readiness} captureTarget={captureTarget} />
            <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:top-5">
                <span>Readiness: {score}%</span>
                <span className={`h-2 w-2 rounded-full ${ready ? 'bg-blue-300 animate-pulse' : readiness?.state === 'near' ? 'bg-orange-300 animate-pulse' : 'bg-emerald-300 animate-pulse'}`}></span>
            </div>
            {sideHint && edgeHintPosition && (
                <div className={`absolute z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-lg font-bold text-white shadow-lg ${edgeHintPosition}`}>
                    {edgeHintArrow}
                </div>
            )}
            <div className="relative flex flex-col items-center gap-3">
                {(!readiness?.analysis?.geometry?.quadrilateral || (readiness?.analysis?.geometry?.boundary_score || 0) < 50) && (
                    <div
                        style={guideStyle}
                        className={`rounded-lg border-2 ${guideColor} transition-all duration-300`}
                    >
                        <div className="h-full w-full rounded-[inherit] border border-white/35"></div>
                    </div>
                )}
                <div className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white shadow-lg">
                    {helper}
                </div>
            </div>
        </div>
    );
};

const CameraModal = ({ isOpen, onClose, onCapture, facingMode, title, captureTarget, idealVideoWidth = 1280, idealVideoHeight = 720, maxCaptureWidth = 1000, maxCaptureHeight = 1000 }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [liveReadiness, setLiveReadiness] = useState(() => smartReadinessFromAnalysis(null, captureTarget));
    const [captureNotice, setCaptureNotice] = useState(null);
    const trackingRef = useRef({});
    const frameBufferRef = useRef([]);
    const autoCaptureRef = useRef(false);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
    };

    const refreshVideoInfo = () => {
        const video = videoRef.current;
        const track = streamRef.current?.getVideoTracks?.()[0];
        const settings = track?.getSettings?.() || {};
        if (!video) return;

        setVideoInfo({
            width: video.videoWidth || settings.width,
            height: video.videoHeight || settings.height,
            deviceWidth: settings.width,
            deviceHeight: settings.height,
            facingMode: settings.facingMode || facingMode,
        });
    };

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setCaptureNotice(null);
            autoCaptureRef.current = false;
            frameBufferRef.current = [];
            trackingRef.current = { startedAt: performance.now(), steadyFrames: 0 };
            setLiveReadiness(smartReadinessFromAnalysis(null, captureTarget));
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: idealVideoWidth },
                    height: { ideal: idealVideoHeight }
                }
            })
            .then(mediaStream => {
                streamRef.current = mediaStream;
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            })
            .catch(err => {
                console.error("Camera Error:", err);
                setError(`Could not access the camera. Please ensure you have granted permission in your browser. Error: ${err.name}`);
                stopCamera();
            });
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode, idealVideoWidth, idealVideoHeight]);

    const commitCanvasCapture = (sourceCanvas, captureMetadata, closeDelay = 0) => {
        if (!sourceCanvas || isCapturing) return;

        setIsCapturing(true);
        sourceCanvas.toBlob(blob => {
            if (!blob) {
                setIsCapturing(false);
                return;
            }

            const file = new File([blob], `${title.replace(/\s/g, '_')}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
            Object.defineProperty(file, 'captureMetadata', {
                value: captureMetadata,
                enumerable: false,
            });

            onCapture(file);
            setIsCapturing(false);
            if (closeDelay > 0) {
                setCaptureNotice('Captured!');
                window.setTimeout(onClose, closeDelay);
            } else {
                onClose();
            }
        }, 'image/jpeg', 0.94);
    };

    const autoCaptureBestBufferedFrame = (readiness) => {
        if (autoCaptureRef.current || captureTarget === 'face') return;

        const now = performance.now();
        const bufferedFrames = frameBufferRef.current.filter((frame) => now - frame.timestamp <= ID_ROLLING_BUFFER_MS);
        const bestFrame = bufferedFrames.sort((first, second) => second.rank - first.rank)[0];
        if (!bestFrame?.canvas) return;

        autoCaptureRef.current = true;
        const captureMetadata = {
            source: 'camera',
            captured_at: new Date().toISOString(),
            auto_capture: true,
            readiness_score: readiness.score,
            steady_frames: readiness.steadyFrames,
            centroid_movement: readiness.centroidMovement,
            document_geometry: readiness.analysis?.geometry || null,
            video_width: videoRef.current?.videoWidth,
            video_height: videoRef.current?.videoHeight,
            facing_mode: facingMode,
        };
        commitCanvasCapture(bestFrame.canvas, captureMetadata, 450);
    };

    useEffect(() => {
        if (!isOpen || !stream || error) return undefined;

        let cancelled = false;
        let busy = false;

        const runAnalysis = () => {
            if (busy || cancelled) return;
            busy = true;

            try {
                let analysis = analyzeLiveCameraFrame(videoRef.current, facingMode, captureTarget);
                const tracker = trackingRef.current;
                const timedOut = captureTarget !== 'face' && performance.now() - (tracker.startedAt || performance.now()) > ID_AUTO_TIMEOUT_MS;

                if (captureTarget !== 'face') {
                    analysis = updateTrackedAnalysis(analysis, tracker);
                    const laplacian = analysis?.quality?.laplacian_variance;
                    if (!tracker.sharpnessThreshold && Number.isFinite(laplacian)) {
                        tracker.sharpnessThreshold = Math.max(45, Math.min(120, laplacian * 0.72));
                    }
                    const stability = updateStability(analysis, tracker);
                    const readiness = smartReadinessFromAnalysis(analysis, captureTarget, {
                        ...stability,
                        sharpnessThreshold: tracker.sharpnessThreshold,
                        timedOut,
                    });

                    if (analysis?.geometry?.boundary_detected && !analysis.geometry.tracking_prediction) {
                        const canvas = drawVideoFrameToCanvas(videoRef.current, facingMode, maxCaptureWidth, maxCaptureHeight);
                        if (canvas) {
                            frameBufferRef.current.push({
                                canvas,
                                timestamp: performance.now(),
                                rank: qualityRankForFrame(readiness),
                            });
                            frameBufferRef.current = frameBufferRef.current.filter((frame) => performance.now() - frame.timestamp <= ID_ROLLING_BUFFER_MS);
                        }
                    }

                    if (!cancelled) {
                        setLiveReadiness(readiness);
                    }
                    if (readiness.ready) {
                        autoCaptureBestBufferedFrame(readiness);
                    }
                    return;
                }

                if (!cancelled) {
                    setLiveReadiness(smartReadinessFromAnalysis(analysis, captureTarget));
                }
            } catch {
                if (!cancelled) {
                    setLiveReadiness(smartReadinessFromAnalysis(null, captureTarget));
                }
            } finally {
                busy = false;
            }
        };

        const initial = window.setTimeout(runAnalysis, 180);
        const interval = window.setInterval(runAnalysis, captureTarget === 'face' ? 260 : 120);

        return () => {
            cancelled = true;
            window.clearTimeout(initial);
            window.clearInterval(interval);
        };
    }, [isOpen, stream, error, facingMode, captureTarget, maxCaptureWidth, maxCaptureHeight]);

    const handleCapture = async () => {
        if (captureTarget !== 'face' && !liveReadiness.ready) return;
        if (captureTarget === 'face' && (liveReadiness.score || 0) < 70) return;

        if (videoRef.current) {
            const video = videoRef.current;
            setIsCapturing(true);
            let captureMetadata;
            try {
                captureMetadata = await createCaptureMetadata(video, facingMode);
            } catch {
                captureMetadata = {
                    source: 'camera',
                    captured_at: new Date().toISOString(),
                    motion_score: null,
                    video_width: video.videoWidth,
                    video_height: video.videoHeight,
                    facing_mode: facingMode,
                };
            }
            const captureCanvas = drawVideoFrameToCanvas(video, facingMode, maxCaptureWidth, maxCaptureHeight);
            setIsCapturing(false);
            commitCanvasCapture(captureCanvas, captureMetadata);
        }
    };

    if (!isOpen) return null;

    const captureReady = captureTarget === 'face'
        ? (liveReadiness.score || 0) >= 70
        : Boolean(liveReadiness.ready);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-0 sm:p-4">
            <div className="bg-white shadow-xl w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-3xl sm:rounded-xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200"><CloseIcon /></button>
                </div>
                <div className="relative min-h-[58vh] flex-grow overflow-hidden bg-slate-950 sm:min-h-[60vh]">
                    {error ? (
                        <div className="m-4 flex h-full min-h-[50vh] items-center justify-center rounded-lg bg-red-50 p-4 text-center text-red-600">{error}</div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            onLoadedMetadata={refreshVideoInfo}
                            onPlaying={refreshVideoInfo}
                            className={`h-full min-h-[58vh] w-full object-cover sm:min-h-[60vh] ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        ></video>
                    )}
                    {!error && <CaptureGuideOverlay captureTarget={captureTarget} streamReady={Boolean(stream && videoInfo?.width)} readiness={liveReadiness} />}
                    {captureNotice && (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35">
                            <div className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-xl">{captureNotice}</div>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <div className="p-4 border-t bg-slate-50 flex gap-3">
                    <SecondaryButton onClick={onClose} className="w-full">Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleCapture} disabled={!stream || !!error || isCapturing || (captureTarget === 'face' ? !captureReady : true)} className="w-full">
                        <CameraIcon/> {isCapturing ? 'Capturing...' : captureTarget === 'face' ? (captureReady ? 'Capture Photo' : 'Align to Capture') : 'Auto Capture Armed'}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};

// --- GALLERY UPLOAD MODAL COMPONENT ---
const GalleryUploadModal = ({ isOpen, onClose, onSelect, title, captureTarget, accept = 'image/*' }) => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setAnalysisResult(null);
        }
    }, [isOpen]);

    const analyzeGalleryImage = async (file) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = () => {
                const maxSize = captureTarget === 'face' ? 800 : 1200;
                let width = img.width;
                let height = img.height;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                let totalBrightness = 0;
                let edgeCount = 0;
                const brightnessValues = [];
                
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                    totalBrightness += brightness;
                    brightnessValues.push(brightness);
                    
                    if (i > 4) {
                        const prevBrightness = brightnessValues[Math.floor(i / 4) - 1];
                        if (Math.abs(brightness - prevBrightness) > 30) {
                            edgeCount++;
                        }
                    }
                }
                
                const avgBrightness = totalBrightness / (data.length / 4);
                const brightnessVariance = brightnessValues.reduce((acc, val) => acc + Math.pow(val - avgBrightness, 2), 0) / brightnessValues.length;
                
                const isDark = avgBrightness < 80;
                const isTooBright = avgBrightness > 200;
                const hasGoodContrast = brightnessVariance > 500;
                const hasEdges = edgeCount > (data.length / 16);
                
                let quality = 70;
                let issues = [];
                let message = 'Image looks good';
                
                if (isDark) {
                    quality -= 25;
                    issues.push('too_dark');
                    message = 'Image is too dark. Consider using better lighting.';
                }
                if (isTooBright) {
                    quality -= 20;
                    issues.push('too_bright');
                    message = 'Image may be overexposed.';
                }
                if (!hasEdges && captureTarget !== 'face') {
                    quality -= 15;
                    issues.push('low_detail');
                    message = 'Image may lack sufficient detail.';
                }
                
                resolve({
                    quality: Math.max(10, Math.min(100, quality)),
                    avgBrightness: Math.round(avgBrightness),
                    brightnessVariance: Math.round(brightnessVariance),
                    hasEdges,
                    isDark,
                    isTooBright,
                    hasGoodContrast,
                    issues,
                    message,
                    dimensions: { width, height },
                });
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        
        setIsAnalyzing(true);
        try {
            const result = await analyzeGalleryImage(file);
            setAnalysisResult(result);
        } catch (error) {
            console.error('Image analysis error:', error);
            setAnalysisResult({ quality: 50, message: 'Could not analyze image', issues: ['analysis_failed'] });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedFile) return;
        
        const fileWithMetadata = new File([selectedFile], selectedFile.name, {
            type: selectedFile.type,
            lastModified: Date.now(),
        });
        
        Object.defineProperty(fileWithMetadata, 'captureMetadata', {
            value: {
                source: 'gallery',
                captured_at: new Date().toISOString(),
                gallery_analysis: analysisResult,
            },
            enumerable: false,
        });
        
        onSelect(fileWithMetadata);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-0 sm:p-4">
            <div className="bg-white shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200"><CloseIcon /></button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                    {!previewUrl ? (
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={accept}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <GalleryIcon />
                            <p className="mt-2 text-slate-600 font-medium">Tap to select from gallery</p>
                            <p className="text-sm text-slate-400 mt-1">JPEG, PNG, or WebP (max 10MB)</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative rounded-lg overflow-hidden bg-slate-100 border">
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-auto max-h-64 object-contain"
                                />
                                <button 
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); setAnalysisResult(null); }}
                                    className="absolute top-2 right-2 bg-slate-800/70 text-white p-1.5 rounded-full hover:bg-slate-900"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center gap-2 py-3 text-slate-600">
                                    <AIProcessingIcon />
                                    <span>Analyzing image quality...</span>
                                </div>
                            ) : analysisResult && (
                                <div className={`p-3 rounded-lg border ${analysisResult.quality >= 60 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-slate-700">AI Quality Score</span>
                                        <span className={`font-bold ${analysisResult.quality >= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                                            {analysisResult.quality}%
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        {analysisResult.message}
                                    </div>
                                    {analysisResult.issues.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {analysisResult.issues.map((issue, idx) => (
                                                <span key={idx} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                                    {issue.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-slate-50 flex gap-3">
                    <SecondaryButton onClick={onClose} className="w-full">Cancel</SecondaryButton>
                    <PrimaryButton 
                        onClick={handleConfirm} 
                        disabled={!selectedFile || isAnalyzing} 
                        className="w-full"
                    >
                        Use This Image
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};

// --- AI ENHANCED ID BORDER ---
const AIIdBorder = ({ readiness, captureTarget }) => {
    const analysis = readiness?.analysis;
    const geometry = analysis?.geometry;
    const quadrilateral = geometry?.quadrilateral;
    const sampleWidth = analysis?.sample_width || analysis?.sampleWidth;
    const sampleHeight = analysis?.sample_height || analysis?.sampleHeight;
    
    if (!quadrilateral || !sampleWidth || !sampleHeight || (geometry?.boundary_score || 0) < 50) {
        return null;
    }

    const points = quadrilateral.map((point) => `${point.x},${point.y}`).join(' ');
    
    const getStatusColor = () => {
        if (readiness?.ready) return { stroke: '#2563eb', fill: 'rgba(37,99,235,0.10)', glow: 'rgba(37,99,235,0.45)' };
        if (readiness?.state === 'near') return { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.08)', glow: 'rgba(245,158,11,0.34)' };
        if (geometry?.boundary_detected) return { stroke: '#10b981', fill: 'rgba(16,185,129,0.07)', glow: 'rgba(16,185,129,0.30)' };
        return { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.06)', glow: 'rgba(245,158,11,0.24)' };
    };
    
    const colors = getStatusColor();
    const strokeWidth = readiness?.ready ? 8 : readiness?.state === 'near' ? 6 : 4;

    return (
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox={`0 0 ${sampleWidth} ${sampleHeight}`} preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <polygon points={points} fill={colors.fill} stroke="rgba(15,23,42,0.45)" strokeWidth={strokeWidth + 7} strokeLinejoin="round" />
            <polygon points={points} fill="transparent" stroke={colors.stroke} strokeWidth={strokeWidth} strokeLinejoin="round" filter="url(#aiGlow)" className="transition-all duration-150" />
            
            {quadrilateral.map((point, index) => (
                <g key={`corner-${index}`}>
                    <circle cx={point.x} cy={point.y} r={readiness?.ready ? 10 : 7} fill={colors.stroke} opacity="0.28" />
                    <circle cx={point.x} cy={point.y} r={readiness?.ready ? 5 : 4} fill={colors.stroke} />
                    <circle cx={point.x} cy={point.y} r="2" fill="white" />
                </g>
            ))}
        </svg>
    );
};

// --- AI FACE SCANNER OVERLAY ---
const AIFaceScanner = ({ readiness }) => {
    const analysis = readiness?.analysis;
    const geometry = analysis?.geometry || {};
    const faceBox = geometry.face_box;
    const quality = analysis?.quality || {};
    const score = Math.round(readiness?.score || 0);
    const ready = readiness?.ready;
    const message = readiness?.message || 'Position your face';
    
    const getStatusColor = () => {
        if (ready) return { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-400' };
        if (readiness?.state === 'detecting') return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-400' };
        return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-400' };
    };
    
    const colors = getStatusColor();

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-950/30"></div>
            
            {faceBox && (
                <div 
                    className="absolute border-2 animate-pulse"
                    style={{
                        left: `${faceBox.x}%`,
                        top: `${faceBox.y}%`,
                        width: `${faceBox.width}%`,
                        height: `${faceBox.height}%`,
                        borderColor: colors.border,
                        backgroundColor: `${colors.bg.replace('bg-', 'rgba(')}${ready ? '20' : '10'}`,
                    }}
                >
                    {ready && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Face Detected
                        </div>
                    )}
                </div>
            )}
            
            <div className="relative flex flex-col items-center gap-4">
                <div 
                    className={`w-56 h-64 sm:w-64 sm:h-80 rounded-[40%] border-3 ${colors.border} bg-slate-900/20 transition-all duration-300`}
                    style={{
                        boxShadow: ready 
                            ? `0 0 40px ${colors.bg.replace('bg-', '')}40, inset 0 0 20px ${colors.bg.replace('bg-', '')}20`
                            : '0 0 20px rgba(59,130,246,0.2)',
                    }}
                >
                    <div className="h-full w-full rounded-[inherit] border border-white/20"></div>
                    
                    {!faceBox && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-16 h-16 text-slate-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col items-center gap-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur ${colors.text}`}>
                        <div className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`}></div>
                        <span className="text-sm font-medium">{message}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                        <span>Quality: {score}%</span>
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-300 ${ready ? 'bg-green-500' : colors.bg}`} 
                                style={{ width: `${score}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute top-4 left-4 right-4 flex justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    AI Face Scan
                </div>
            </div>
        </div>
    );
};

// --- STEP COMPONENTS ---
const Step1_BasicInfo = ({ data, setData, errors }) => {
    const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="first_name" className="font-medium text-slate-700 text-sm mb-2 block">First Name</label>
                    <CustomTextInput id="first_name" name="first_name" icon={<UserIcon />} value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} required autoFocus error={errors.first_name} />
                    <InputError message={errors.first_name} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="last_name" className="font-medium text-slate-700 text-sm mb-2 block">Last Name</label>
                    <CustomTextInput id="last_name" name="last_name" icon={<UserIcon />} value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} required error={errors.last_name} />
                    <InputError message={errors.last_name} className="mt-2" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="middle_name" className="font-medium text-slate-700 text-sm mb-2 block">Middle Name <span className="text-slate-400">(Optional)</span></label>
                    <CustomTextInput id="middle_name" name="middle_name" icon={<UserIcon />} value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} error={errors.middle_name} />
                    <InputError message={errors.middle_name} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="suffix" className="font-medium text-slate-700 text-sm mb-2 block">Suffix <span className="text-slate-400">(Optional)</span></label>
                    <CustomSelect id="suffix" name="suffix" icon={<UserIcon />} value={data.suffix} onChange={(e) => setData('suffix', e.target.value)} error={errors.suffix}>
                        <option value="">None</option>
                        {suffixes.map(s => <option key={s} value={s}>{s}</option>)}
                    </CustomSelect>
                    <InputError message={errors.suffix} className="mt-2" />
                </div>
            </div>
        </div>
    );
};

const Step2_PersonalDetails = ({ data, setData, errors, phoneValidation }) => {

    const handlePhoneChange = (e) => {
        const input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
        setData('phone_number', input.substring(0, 10)); // Limit to 10 digits (e.g., 9171234567)
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Personal Details</h3>

            {/* Province and city are set automatically behind the scenes. */}

            <div>
                <label htmlFor="street_address" className="font-medium text-slate-700 text-sm mb-2 block">Street Address, House No.</label>
                <CustomTextInput id="street_address" name="street_address" icon={<HomeIcon />} value={data.street_address} onChange={(e) => setData('street_address', e.target.value)} required error={errors.street_address} />
                <InputError message={errors.street_address} className="mt-2" />
            </div>
            
             <div>
                <label htmlFor="phone_number" className="font-medium text-slate-700 text-sm mb-2 block">Phone Number</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <PhoneIcon />
                        <span className="text-slate-500 ml-2">+63</span>
                    </div>
                    <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={data.phone_number}
                        onChange={handlePhoneChange}
                        placeholder="9XX-XXX-XXXX"
                        required
                        className={`w-full pl-24 pr-4 py-3 border rounded-lg shadow-sm transition-all duration-300 bg-slate-50 hover:bg-white ${ (errors.phone_number || phoneValidation.status === 'invalid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/50' }`}
                    />
                    {!errors.phone_number && <ValidationIndicator status={phoneValidation.status} />}
                </div>
                {phoneValidation.status === 'invalid' && <InputError message={phoneValidation.message} className="mt-2" />}
                <InputError message={errors.phone_number} className="mt-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="birthday" className="font-medium text-slate-700 text-sm mb-2 block">Birthday</label>
                    <CustomTextInput id="birthday" name="birthday" type="date" icon={<CalendarIcon />} value={data.birthday} onChange={(e) => setData('birthday', e.target.value)} required className="text-sm h-12" error={errors.birthday} />
                    <InputError message={errors.birthday} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="gender" className="font-medium text-slate-700 text-sm mb-2 block">Gender</label>
                    <CustomSelect id="gender" name="gender" icon={<GenderIcon />} value={data.gender} onChange={(e) => setData('gender', e.target.value)} required error={errors.gender}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </CustomSelect>
                     <InputError message={errors.gender} className="mt-2" />
                </div>
            </div>

            <div>
                <label htmlFor="place_of_birth" className="font-medium text-slate-700 text-sm mb-2 block">Place of Birth</label>
                <CustomTextInput 
                    id="place_of_birth" 
                    name="place_of_birth" 
                    icon={<MapPinIcon />} 
                    value={data.place_of_birth} 
                    onChange={(e) => setData('place_of_birth', e.target.value)} 
                    required 
                    error={errors.place_of_birth}
                    placeholder="City / Municipality, Province"
                />
                <InputError message={errors.place_of_birth} className="mt-2" />
            </div>
            
            <div>
                <label htmlFor="civil_status" className="font-medium text-slate-700 text-sm mb-2 block">Civil Status</label>
                <CustomSelect id="civil_status" name="civil_status" icon={<StatusIcon />} value={data.civil_status} onChange={(e) => setData('civil_status', e.target.value)} required error={errors.civil_status}>
                    <option value="">Select...</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                </CustomSelect>
                <InputError message={errors.civil_status} className="mt-2" />
            </div>
        </div>
    );
};

const Step3_AccountCredentials = ({ data, setData, errors, passwordVisible, setPasswordVisible, confirmPasswordVisible, setConfirmPasswordVisible, passwordsDoNotMatch, emailValidation }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Account Credentials</h3>
        <div>
            <label htmlFor="email" className="font-medium text-slate-700 text-sm mb-2 block">Email Address</label>
            <div className="relative">
                <CustomTextInput
                    id="email"
                    name="email"
                    type="email"
                    icon={<MailIcon />}
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    error={errors.email || emailValidation.status === 'invalid'}
                    className="pr-12"
                />
                {!errors.email && <ValidationIndicator status={emailValidation.status} />}
            </div>
            {emailValidation.status === 'invalid' && <InputError message={emailValidation.message} className="mt-2" />}
            <InputError message={errors.email} className="mt-2" />
        </div>
        <div>
            <label htmlFor="password" className="font-medium text-slate-700 text-sm mb-2 block">Password</label>
            <div className="relative">
                <CustomTextInput id="password" name="password" type={passwordVisible ? 'text' : 'password'} icon={<LockIcon />} value={data.password} onChange={(e) => setData('password', e.target.value)} required error={errors.password} />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm z-10"> {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />} </button>
            </div>
            <InputError message={errors.password} className="mt-2" />
            <PasswordStrengthIndicator password={data.password} />
        </div>
        <div>
            <label htmlFor="password_confirmation" className="font-medium text-slate-700 text-sm mb-2 block">Confirm Password</label>
              <div className="relative">
                <CustomTextInput id="password_confirmation" name="password_confirmation" type={confirmPasswordVisible ? 'text' : 'password'} icon={<LockIcon />} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required error={errors.password_confirmation || passwordsDoNotMatch} />
                   <button type="button" onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm z-10"> {confirmPasswordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />} </button>
            </div>
            {passwordsDoNotMatch && <InputError message="Passwords do not match." className="mt-2" />}
            <InputError message={errors.password_confirmation} className="mt-2" />
        </div>
    </div>
);

const Step4_Verification = ({ data, setData, errors, clearErrors, termsViewed, agreeToTerms, setAgreeToTerms, setIsTermsModalOpen, idFrontValidation, idBackValidation, selfieValidation }) => {
    const [idFrontPreview, setIdFrontPreview] = useState(null);
    const [idBackPreview, setIdBackPreview] = useState(null);
    const [faceImagePreview, setFaceImagePreview] = useState(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraTarget, setCameraTarget] = useState(null);
    
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState(null);

    const handleCapture = (file) => {
        const previewUrl = URL.createObjectURL(file);
        clearErrors('images');

        switch (cameraTarget) {
            case 'id_front':
                setIdFrontPreview(previewUrl);
                setData('valid_id_front_image', file);
                clearErrors('valid_id_front_image');
                break;
            case 'id_back':
                setIdBackPreview(previewUrl);
                setData('valid_id_back_image', file);
                clearErrors('valid_id_back_image');
                break;
            case 'face':
                setFaceImagePreview(previewUrl);
                setData('face_image', file);
                clearErrors('face_image');
                break;
            default:
                break;
        }
    };

    const handleGallerySelect = (file) => {
        const previewUrl = URL.createObjectURL(file);
        clearErrors('images');

        switch (galleryTarget) {
            case 'id_front':
                setIdFrontPreview(previewUrl);
                setData('valid_id_front_image', file);
                clearErrors('valid_id_front_image');
                break;
            case 'id_back':
                setIdBackPreview(previewUrl);
                setData('valid_id_back_image', file);
                clearErrors('valid_id_back_image');
                break;
            case 'face':
                setFaceImagePreview(previewUrl);
                setData('face_image', file);
                clearErrors('face_image');
                break;
            default:
                break;
        }
    };

    const validIdOptions = [
        "Philippine Identification (PhilID / ePhilID)", "Passport", "Driver's License", "UMID Card",
        "PhilHealth ID", "Postal ID", "Voter's ID", "PRC ID", "School ID", "Government ID",
    ];
    const isIdCapture = cameraTarget === 'id_front' || cameraTarget === 'id_back';

    return (
        <>
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                facingMode={cameraTarget === 'face' ? 'user' : 'environment'}
                title={`Take Picture of ${cameraTarget?.replace('_', ' ')?.replace('id', 'ID') || ''}`}
                captureTarget={cameraTarget}
                idealVideoWidth={isIdCapture ? 1920 : 1280}
                idealVideoHeight={isIdCapture ? 1080 : 720}
                maxCaptureWidth={isIdCapture ? 1600 : 1000}
                maxCaptureHeight={isIdCapture ? 1200 : 1000}
            />
            <GalleryUploadModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onSelect={handleGallerySelect}
                title={`Select ${galleryTarget?.replace('_', ' ')?.replace('id', 'ID') || ''} from Gallery`}
                captureTarget={galleryTarget}
                accept="image/jpeg,image/png,image/webp"
            />
            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold text-slate-700">Identity Verification</h3>
                </div>

                <InputError message={errors.images} className="mt-2" />

                <div>
                    <label htmlFor="valid_id_type" className="font-medium text-slate-700 text-sm mb-2 block">Type of Valid ID</label>
                    <CustomSelect id="valid_id_type" name="valid_id_type" icon={<IdCardIcon />} value={data.valid_id_type} onChange={(e) => setData('valid_id_type', e.target.value)} required error={errors.valid_id_type}>
                        <option value="">Select ID Type...</option>
                        {validIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                    </CustomSelect>
                    <InputError message={errors.valid_id_type} className="mt-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-medium text-slate-700 text-sm">Front of ID</label>
                        <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                            {idFrontPreview ? <img src={idFrontPreview} alt="ID Front Preview" className="h-full w-full object-contain" /> : <span className="text-slate-500 text-xs">Front Preview</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <SecondaryButton type="button" onClick={() => { setCameraTarget('id_front'); setIsCameraOpen(true); }} className="!py-2 !text-sm"><CameraIcon /> Camera</SecondaryButton>
                            <SecondaryButton type="button" onClick={() => { setGalleryTarget('id_front'); setIsGalleryOpen(true); }} className="!py-2 !text-sm"><GalleryIcon /> Gallery</SecondaryButton>
                        </div>
                        <IdPrecheckMessage validation={idFrontValidation} />
                        <InputError message={errors.valid_id_front_image} className="mt-2" />
                    </div>
                    <div className="space-y-2">
                        <label className="font-medium text-slate-700 text-sm">Back of ID</label>
                        <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                            {idBackPreview ? <img src={idBackPreview} alt="ID Back Preview" className="h-full w-full object-contain" /> : <span className="text-slate-500 text-xs">Back Preview</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <SecondaryButton type="button" onClick={() => { setCameraTarget('id_back'); setIsCameraOpen(true); }} className="!py-2 !text-sm"><CameraIcon /> Camera</SecondaryButton>
                            <SecondaryButton type="button" onClick={() => { setGalleryTarget('id_back'); setIsGalleryOpen(true); }} className="!py-2 !text-sm"><GalleryIcon /> Gallery</SecondaryButton>
                        </div>
                        <IdPrecheckMessage validation={idBackValidation} />
                        <InputError message={errors.valid_id_back_image} className="mt-2" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-medium text-slate-700 text-sm">Your Photo (Selfie)</label>
                    <div className="w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {faceImagePreview ? <img src={faceImagePreview} alt="Face Preview" className="h-full w-full object-contain" /> : <span className="text-slate-500 text-sm">Face Preview</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <SecondaryButton type="button" onClick={() => { setCameraTarget('face'); setIsCameraOpen(true); }} className="!py-2 !text-sm"><CameraIcon /> Camera</SecondaryButton>
                        <SecondaryButton type="button" onClick={() => { setGalleryTarget('face'); setIsGalleryOpen(true); }} className="!py-2 !text-sm"><GalleryIcon /> Gallery</SecondaryButton>
                    </div>
                    <IdPrecheckMessage validation={selfieValidation} />
                    <InputError message={errors.face_image} className="mt-2" />
                </div>

                <div className={`pt-2 flex items-start ${!termsViewed ? 'opacity-60' : ''}`} title={!termsViewed ? 'Please view the Terms and Conditions first to enable this.' : ''}>
                    <div className="flex items-center h-5">
                        <input id="terms" name="terms" type="checkbox" className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded ${!termsViewed ? 'cursor-not-allowed' : ''}`} checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} disabled={!termsViewed} />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className={`text-slate-600 ${!termsViewed ? 'cursor-not-allowed' : ''}`}>I have read and agree to the{' '} <button type="button" onClick={() => setIsTermsModalOpen(true)} className="font-medium text-blue-600 hover:underline focus:outline-none">Terms and Conditions</button>.</label>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- MAIN REGISTER COMPONENT ---
export default function App({ footerData }) {
    const [step, setStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(true);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [termsViewed, setTermsViewed] = useState(false);
    const formContainerRef = useRef(null);
    const formRef = useRef(null);
    const validationQueueRef = useRef(Promise.resolve());

    // Initialize with default values directly in useForm so we don't need to load the json!
    const { data, setData, transform, post, processing, errors, reset, clearErrors, setError } = useForm({
        first_name: '', last_name: '', middle_name: '', suffix: '',
        province: 'Nueva Ecija', city: 'City of Gapan',
        street_address: '', phone_number: '', birthday: '', gender: '', civil_status: '', place_of_birth: '',
        email: '', password: '', password_confirmation: '',
        valid_id_type: '',
        valid_id_front_image: null,
        valid_id_back_image: null,
        face_image: null,
    });

    // --- Validations ---
    const passwordValidation = useMemo(() => getPasswordValidationState(data.password), [data.password]);
    const passwordsDoNotMatch = data.password_confirmation && data.password !== data.password_confirmation;
    const [phoneValidation, setPhoneValidation] = useState({ status: 'idle', message: '' });
    const [emailValidation, setEmailValidation] = useState({ status: 'idle', message: '' });
    const [idFrontValidation, setIdFrontValidation] = useState({ status: 'idle', message: '' });
    const [idBackValidation, setIdBackValidation] = useState({ status: 'idle', message: '' });
    const [selfieValidation, setSelfieValidation] = useState({ status: 'idle', message: '' });

    const enqueueValidation = (task) => {
        const nextTask = validationQueueRef.current.catch(() => {}).then(task);
        validationQueueRef.current = nextTask.catch(() => {});
        return nextTask;
    };

    const stepFields = {
        1: ['first_name', 'last_name'],
        // Added 'place_of_birth' and removed province/city since they are defaulted
        2: ['street_address', 'phone_number', 'birthday', 'gender', 'place_of_birth', 'civil_status'],
        3: ['email', 'password', 'password_confirmation'],
        4: ['valid_id_type', 'valid_id_front_image', 'valid_id_back_image', 'face_image', 'terms']
    };

    const submit = (e) => {
        e.preventDefault();
        clearErrors();

        const missingFields = [];
        if (!data.valid_id_type) missingFields.push("ID Type");
        if (!data.valid_id_front_image) missingFields.push("Front of ID");
        if (!data.valid_id_back_image) missingFields.push("Back of ID");
        if (!data.face_image) missingFields.push("Your Photo (Selfie)");
        if (!agreeToTerms) missingFields.push("Agreement to Terms and Conditions");

        if (missingFields.length > 0) {
            setError('images', `Please complete the following: ${missingFields.join(', ')}.`);
            return;
        }

        const imageChecks = [
            { field: 'valid_id_front_image', label: 'Front of ID', validation: idFrontValidation },
            { field: 'valid_id_back_image', label: 'Back of ID', validation: idBackValidation },
            { field: 'face_image', label: 'Selfie', validation: selfieValidation },
        ];

        for (const check of imageChecks) {
            if (check.validation.status === 'checking') {
                setError(check.field, `Please wait for the ${check.label} validation to finish.`);
                return;
            }

            if (check.validation.status !== 'valid') {
                setError(check.field, check.validation.message || `${check.label} must pass validation before registration.`);
                return;
            }
        }

        transform((values) => ({
            ...values,
            phone_number: `+63${values.phone_number}`,
            terms: agreeToTerms ? '1' : '0',
        }));

        post(route('register'), {
            forceFormData: true,
            onSuccess: () => {
                reset('password', 'password_confirmation');
            },
            onError: (errs) => {
                console.error('Registration failed with errors:', errs);
            },
        });
    };

    const validateAndNavigate = (direction) => {
        clearErrors();
        let canProceed = true;

        if (direction === 'next') {
            const currentStepFields = stepFields[step];
            for (const field of currentStepFields) {
                const value = field === 'terms' ? agreeToTerms : data[field];
                if (!value) {
                    setError(field, 'This field is required.');
                    canProceed = false;
                }
            }
        }

        if (canProceed) {
            setStep(prev => direction === 'next' ? Math.min(prev + 1, 4) : Math.max(prev - 1, 1));
        } else {
              const firstErrorField = formRef.current.querySelector('[class*="border-red-500"]');
                if (firstErrorField) {
                    firstErrorField.focus();
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const nextStep = () => validateAndNavigate('next');
    const prevStep = () => validateAndNavigate('back');

    // --- UI Values ---
    const progressWidth = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };
    const stepTitles = { 1: "Step 1: Basic Info", 2: "Step 2: Personal Details", 3: "Step 3: Account", 4: "Step 4: Verification" };

    // --- Async Validations ---
    useEffect(() => {
        if (!data.phone_number || data.phone_number.length !== 10) {
            setPhoneValidation({ status: 'idle', message: '' });
            return;
        }
        setPhoneValidation({ status: 'checking', message: '' });
        const handler = setTimeout(() => {
            axios.post('/validate-phone', { phone_number: `+63${data.phone_number}` })
                 .then(res => setPhoneValidation(res.data.is_taken ? { status: 'invalid', message: 'Phone number is already taken.' } : { status: 'valid', message: '' }))
                 .catch(() => setPhoneValidation({ status: 'idle', message: 'Could not verify number.' }));
        }, 500);
        return () => clearTimeout(handler);
    }, [data.phone_number]);

    useEffect(() => {
        const isEmailValid = /^\S+@\S+\.\S+$/.test(data.email);
        if (!data.email || !isEmailValid) {
            setEmailValidation({ status: 'idle', message: '' });
            return;
        }
        setEmailValidation({ status: 'checking', message: '' });
        const handler = setTimeout(() => {
            axios.post('/validate-email', { email: data.email })
                 .then(res => setEmailValidation(res.data.is_taken ? { status: 'invalid', message: 'Email is already registered.' } : { status: 'valid', message: '' }))
                 .catch(() => setEmailValidation({ status: 'idle', message: 'Could not verify email.' }));
        }, 500);
        return () => clearTimeout(handler);
    }, [data.email]);

    const validateRegistrationImage = (role, fieldName, file, setValidation, controller) => {
        return validateRegistrationImageWasm({
            role,
            file,
            validIdType: data.valid_id_type,
            signal: controller.signal,
        })
            .then((response) => {
                const result = response || {};
                const nextStatus = result.status || (result.is_valid ? 'valid' : 'invalid');
                const fallbackValidMessage = role === 'selfie' ? 'Selfie looks valid.' : role === 'back_id' ? 'Back of ID looks valid.' : 'ID looks valid.';
                const fallbackInvalidMessage = role === 'selfie' ? 'The selfie is not valid. Please retake the photo.' : 'The ID is not valid. Please retake the photo.';
                const nextMessage = result.message || (nextStatus === 'valid' ? fallbackValidMessage : fallbackInvalidMessage);

                setValidation({ ...result, status: nextStatus, message: nextMessage });

                if (nextStatus === 'invalid') {
                    setError(fieldName, nextMessage);
                } else {
                    clearErrors(fieldName);
                }
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;

                const message = error.message || 'The image could not be checked. Please retake a clear photo.';
                const status = 'unchecked';

                setValidation({ status, message, error: error.message, diagnostics: { mode: 'browser_wasm', error: error.message } });
                if (status === 'invalid') {
                    setError(fieldName, message);
                } else {
                    clearErrors(fieldName);
                }
            });
    };

    useEffect(() => {
        if (!data.valid_id_front_image || !data.valid_id_type) {
            setIdFrontValidation({ status: 'idle', message: '' });
            return;
        }

        setIdFrontValidation({ status: 'checking', message: 'Checking front ID photo...' });
        clearErrors('valid_id_front_image');

        const controller = new AbortController();
        const handler = setTimeout(() => {
            enqueueValidation(() => validateRegistrationImage('front_id', 'valid_id_front_image', data.valid_id_front_image, setIdFrontValidation, controller));
        }, 500);

        return () => {
            clearTimeout(handler);
            controller.abort();
        };
    }, [data.valid_id_front_image, data.valid_id_type]);

    useEffect(() => {
        if (!data.valid_id_back_image || !data.valid_id_type) {
            setIdBackValidation({ status: 'idle', message: '' });
            return;
        }

        setIdBackValidation({ status: 'checking', message: 'Checking back ID photo...' });
        clearErrors('valid_id_back_image');

        const controller = new AbortController();
        const handler = setTimeout(() => {
            enqueueValidation(() => validateRegistrationImage('back_id', 'valid_id_back_image', data.valid_id_back_image, setIdBackValidation, controller));
        }, 500);

        return () => {
            clearTimeout(handler);
            controller.abort();
        };
    }, [data.valid_id_back_image, data.valid_id_type]);

    useEffect(() => {
        if (!data.face_image) {
            setSelfieValidation({ status: 'idle', message: '' });
            return;
        }

        setSelfieValidation({ status: 'checking', message: 'Checking selfie...' });
        clearErrors('face_image');

        const controller = new AbortController();
        const handler = setTimeout(() => {
            enqueueValidation(() => validateRegistrationImage('selfie', 'face_image', data.face_image, setSelfieValidation, controller));
        }, 500);

        return () => {
            clearTimeout(handler);
            controller.abort();
        };
    }, [data.face_image]);

    useEffect(() => {
        if (formContainerRef.current) {
            formContainerRef.current.scrollTop = 0;
        }
    }, [step]);

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1_BasicInfo data={data} setData={setData} errors={errors} />;
            case 2: return <Step2_PersonalDetails data={data} setData={setData} errors={errors} phoneValidation={phoneValidation} />;
            case 3: return <Step3_AccountCredentials data={data} setData={setData} errors={errors} passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} confirmPasswordVisible={confirmPasswordVisible} setConfirmPasswordVisible={setConfirmPasswordVisible} passwordsDoNotMatch={passwordsDoNotMatch} emailValidation={emailValidation} />;
            case 4: return <Step4_Verification data={data} setData={setData} errors={errors} clearErrors={clearErrors} termsViewed={termsViewed} agreeToTerms={agreeToTerms} setAgreeToTerms={setAgreeToTerms} setIsTermsModalOpen={setIsTermsModalOpen} idFrontValidation={idFrontValidation} idBackValidation={idBackValidation} selfieValidation={selfieValidation} />;
            default: return null;
        }
    };
    
    const handleTermsClose = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
        setAgreeToTerms(true);
    };

    const imageValidationBlocksSubmit =
        processing
        || (data.valid_id_front_image && idFrontValidation.status !== 'valid')
        || (data.valid_id_back_image && idBackValidation.status !== 'valid')
        || (data.face_image && selfieValidation.status !== 'valid');

    return (
        <>
            <TermsModal isOpen={isTermsModalOpen} onClose={handleTermsClose}>
                <TermsAndConditionsContent />
            </TermsModal>

            <div className="bg-gradient-to-br from-sky-50 to-slate-200">
                <Head title="Register | Brgy. San Lorenzo" />
                <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } .animate-fade-in-fast { animation: fadeIn 0.2s ease-in-out; }`}</style>
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden md:flex">
                         <AuthLayout
                            title={footerData?.footer_title}
                            mainTitle={footerData?.footer_subtitle || 'Gapan City, Nueva Ecija'}
                            description="Join our community portal. Register for an account to access barangay services, announcements, and more."
                            logoUrl={footerData?.footer_logo_url}
                        />
                        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
                            <div className="flex justify-center mb-6 md:hidden">
                                <img src="/images/gapanlogo.png" alt="Barangay Logo" className="h-16 w-16" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Create Your Account</h2>
                            <p className="text-slate-500 mb-6 text-center">Let's get you started.</p>
                            
                            <div className="mb-8">
                                <div className="flex justify-between mb-2">
                                    <p className="text-sm font-medium text-blue-700">{stepTitles[step]}</p>
                                    <p className="text-sm font-medium text-slate-500">{`${step} of 4`}</p>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: progressWidth[step] }}></div>
                                </div>
                            </div>
                            
                            <div ref={formContainerRef} className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                                <form ref={formRef} onSubmit={submit} noValidate>
                                    <div key={step} className="animate-fade-in"> {renderStep()} </div>
                                    <div className="pt-6 space-y-4">
                                        {step === 1 && <PrimaryButton type="button" onClick={nextStep}>Next Step</PrimaryButton>}
                                        {step === 2 && ( <div className="flex gap-4"> <SecondaryButton onClick={prevStep}>Back</SecondaryButton> <PrimaryButton type="button" onClick={nextStep}>Next Step</PrimaryButton> </div> )}
                                        {step === 3 && ( <div className="flex gap-4"> <SecondaryButton onClick={prevStep}>Back</SecondaryButton> <PrimaryButton type="button" onClick={nextStep}>Next Step</PrimaryButton> </div> )}
                                        {step === 4 && (
                                            <div className="flex gap-4">
                                                 <SecondaryButton onClick={prevStep} disabled={processing}>Back</SecondaryButton>
                                                 <PrimaryButton type="submit" disabled={imageValidationBlocksSubmit}>Register</PrimaryButton>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="mt-auto pt-16 text-center">
                                <p className="text-sm text-slate-600">Already have an account?{' '} <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Sign in here</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
