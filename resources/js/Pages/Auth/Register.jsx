import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import InputError from '@/Components/InputError';

// --- HELPER & UI COMPONENTS ---
const CloseIcon = () => ( <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> );
const TermsModal = ({ isOpen, onClose, children }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true" aria-labelledby="modal-title" > <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"> <div className="flex justify-between items-center p-4 border-b shrink-0"> <h2 id="modal-title" className="text-xl font-semibold text-slate-800">Terms and Conditions</h2> <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors" aria-label="Close" > <CloseIcon /> </button> </div> <div className="p-6 overflow-y-auto"> {children} </div> <div className="p-4 border-t bg-slate-50 text-right shrink-0 rounded-b-lg"> <PrimaryButton onClick={onClose} className="w-auto px-8 !py-2 !text-sm"> I Understand </PrimaryButton> </div> </div> </div> ); };
const TermsAndConditionsContent = () => ( <div className="prose prose-sm max-w-none text-slate-600"> <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p> <p>Welcome to the Barangay San Lorenzo Document Request System. By creating an account and using this service, you agree to comply with and be bound by the following terms and conditions of use.</p> <br /> <h4>1. Acceptance of Terms</h4> <p>This service is provided to the residents of Barangay San Lorenzo, Gapan City, for the purpose of requesting official barangay documents online. By accessing or using the service, you agree to these Terms and Conditions and our Privacy Policy.</p> <br /> <h4>2. User Account and Responsibilities</h4> <ul> <li>You must be a legitimate resident of Barangay San Lorenzo to create an account.</li> <li>You are responsible for providing accurate, current, and complete information during the registration process. Any falsification of information may lead to the suspension of your account and legal action.</li> <li>You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account.</li> </ul> <br /> <h4>3. Document Request Process</h4> <ul> <li>All document requests are subject to verification and approval by authorized barangay personnel.</li> <li>The processing times for document requests are estimates and are not guaranteed.</li> <li>Fees may apply for certain documents. You will be notified of any applicable fees before your request is finalized. All payments must be settled through the official channels specified by the barangay.</li> <li>The collection of documents must be done in person at the barangay hall unless another delivery method is specified and approved. You must present a valid ID upon collection.</li> </ul> <br /> <h4>4. Data Privacy</h4> <p>We are committed to protecting your privacy in accordance with the Data Privacy Act of 2012 (R.A. 10173) of the Philippines. The personal information you provide will be used exclusively for processing your document requests and for official communication. Your data will not be shared with third parties without your explicit consent, except as required by law.</p> <br /> <h4>5. Prohibited Conduct</h4> <p>You agree not to use this service for any unlawful purpose, including but not limited to submitting fraudulent requests, attempting to access unauthorized data, or disrupting the service's operations.</p> <br /> <h4>6. Disclaimer</h4> <p>This service is provided "as is" without any warranties. The Barangay does not guarantee that the service will be error-free or uninterrupted. The accuracy of the information you provide is your sole responsibility.</p> <br /> <h4>7. Limitation of Liability</h4> <p>You understand and agree that your use of this system is at your own risk. While the Barangay and its developers implement reasonable security measures to protect your information, we cannot guarantee absolute security against all potential threats such as sophisticated cyber-attacks. The internet is not a completely secure environment.</p> <p>To the fullest extent permitted by law, **Barangay San Lorenzo, its officials, employees, and the system developers shall not be liable** for any direct, indirect, incidental, or consequential damages, including but not limited to data loss, unauthorized access, or information leaks resulting from security breaches or system failures beyond our reasonable control. By using this service, you agree to hold the Barangay and its developers harmless from any claims arising from such incidents.</p> <br /> <h4>8. Changes to Terms</h4> <p>Barangay San Lorenzo reserves the right to modify these terms and conditions at any time. We will notify you of any changes by posting the new terms on this site. Your continued use of the service after any such changes constitutes your acceptance of the new terms.</p> <br /> <h4>9. Contact Information</h4> <p>If you have any questions about these Terms and Conditions, please contact the Barangay Hall directly.</p> </div> );
const AuthLayout = ({ title, description }) => ( <div className="w-full md:w-1/2 text-white p-8 md:p-12 flex flex-col justify-center relative bg-cover bg-center" style={{ backgroundImage: "url('/images/brgy.png')" }}> <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-800/90"></div> <div className="relative z-10"> <div className="flex items-center mb-8"> <div className="w-16 h-16 mr-4 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 p-2 shadow-lg"> <img src="/images/gapanlogo.png" alt="Barangay Logo" className="w-full h-full rounded-full" /> </div> <h1 className="text-3xl font-bold tracking-tight text-shadow">{title}</h1> </div> <p className="text-blue-100 text-lg leading-relaxed text-shadow-sm">{description}</p> <p className="text-xs text-blue-200 mt-12 opacity-75">Gapan City, Nueva Ecija</p> </div> </div> );
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
const CameraIcon = () => <svg className="h-5 w-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const IdCardIcon = () => <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-9 4h2m-2 4h4m6-4v4m-2-2h4"></path></svg>;

// --- CAMERA MODAL COMPONENT ---
const CameraModal = ({ isOpen, onClose, onCapture, facingMode, title }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setError(null);
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            .then(mediaStream => {
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
    }, [isOpen, facingMode]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (facingMode === 'user') {
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const maxWidth = 800;
            const maxHeight = 600;
            let newWidth = canvas.width;
            let newHeight = canvas.height;

            if (newWidth > maxWidth || newHeight > maxHeight) {
                const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
                newWidth *= ratio;
                newHeight *= ratio;
            }

            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            const resizedContext = resizedCanvas.getContext('2d');
            resizedContext.imageSmoothingEnabled = true;
            resizedContext.imageSmoothingQuality = 'high';
            resizedContext.drawImage(canvas, 0, 0, newWidth, newHeight);

            resizedCanvas.toBlob(blob => {
                const file = new File([blob], `${title.replace(/\s/g, '_')}.png`, { type: 'image/png' });
                onCapture(file);
                onClose();
            }, 'image/png', 0.9);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200"><CloseIcon /></button>
                </div>
                <div className="p-4 flex-grow relative overflow-hidden">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-center text-red-600 bg-red-50 rounded-md p-4">{error}</div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full object-contain rounded-md ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        ></video>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <div className="p-4 border-t bg-slate-50 flex gap-4">
                    <SecondaryButton onClick={onClose} className="w-full">Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleCapture} disabled={!stream || !!error} className="w-full">
                        <CameraIcon/> Capture Photo
                    </PrimaryButton>
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

const Step2_PersonalDetails = ({ data, setData, errors, phoneValidation, locations, isLoadingLocations }) => {

    const provinces = useMemo(() => (locations ? Object.keys(locations).sort() : []), [locations]);
    const cities = useMemo(() => (data.province && locations ? Object.keys(locations[data.province]).sort() : []), [data.province, locations]);
    const barangays = useMemo(() => (
        data.province && data.city && locations && locations[data.province] && locations[data.province][data.city] 
        ? locations[data.province][data.city].sort() 
        : []
    ), [data.province, data.city, locations]);
    const handlePhoneChange = (e) => {
        const input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
        setData('phone_number', input.substring(0, 10)); // Limit to 10 digits (e.g., 9171234567)
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Personal Details</h3>

            {/* Address Dropdowns */}
            <div>
                <label htmlFor="province" className="font-medium text-slate-700 text-sm mb-2 block">Province</label>
                <CustomSelect id="province" name="province" icon={<MapPinIcon />} value={data.province} onChange={(e) => setData({ ...data, province: e.target.value, city: '', barangay: '' })} required error={errors.province} disabled={isLoadingLocations}>
                    <option value="">{isLoadingLocations ? 'Loading...' : 'Select Province...'}</option>
                    {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </CustomSelect>
                <InputError message={errors.province} className="mt-2" />
            </div>

            <div>
                <label htmlFor="city" className="font-medium text-slate-700 text-sm mb-2 block">City / Municipality</label>
                <CustomSelect id="city" name="city" icon={<MapPinIcon />} value={data.city} onChange={(e) => setData({ ...data, city: e.target.value, barangay: '' })} required error={errors.city} disabled={!data.province}>
                    <option value="">Select City / Municipality...</option>
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </CustomSelect>
                <InputError message={errors.city} className="mt-2" />
            </div>

            <div>
                <label htmlFor="barangay" className="font-medium text-slate-700 text-sm mb-2 block">Barangay</label>
                <CustomSelect id="barangay" name="barangay" icon={<MapPinIcon />} value={data.barangay} onChange={(e) => setData('barangay', e.target.value)} required error={errors.barangay} disabled={!data.city}>
                    <option value="">Select Barangay...</option>
                    {barangays.map(brgy => <option key={brgy} value={brgy}>{brgy}</option>)}
                </CustomSelect>
                <InputError message={errors.barangay} className="mt-2" />
            </div>

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

const Step4_Verification = ({ data, setData, errors, termsViewed, agreeToTerms, setAgreeToTerms, setIsTermsModalOpen }) => {
    const [idFrontPreview, setIdFrontPreview] = useState(null);
    const [idBackPreview, setIdBackPreview] = useState(null);
    const [faceImagePreview, setFaceImagePreview] = useState(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraTarget, setCameraTarget] = useState(null);

    const handleCapture = (file) => {
        const previewUrl = URL.createObjectURL(file);
        if (errors.images) delete errors.images;

        switch (cameraTarget) {
            case 'id_front':
                setIdFrontPreview(previewUrl);
                setData('valid_id_front_image', file);
                break;
            case 'id_back':
                setIdBackPreview(previewUrl);
                setData('valid_id_back_image', file);
                break;
            case 'face':
                setFaceImagePreview(previewUrl);
                setData('face_image', file);
                break;
            default:
                break;
        }
    };

    const validIdOptions = [
        "Philippine Identification (PhilID / ePhilID)", "Passport", "Driver's License", "UMID Card",
        "PhilHealth ID", "Postal ID", "Voter's ID", "PRC ID",
    ];

    return (
        <>
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                facingMode={cameraTarget === 'face' ? 'user' : 'environment'}
                title={`Take Picture of ${cameraTarget?.replace('_', ' ')?.replace('id', 'ID') || ''}`}
            />
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Identity Verification</h3>

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
                        <SecondaryButton type="button" onClick={() => { setCameraTarget('id_front'); setIsCameraOpen(true); }} className="w-full !py-2 !text-sm"><CameraIcon /> Capture Front</SecondaryButton>
                    </div>
                    <div className="space-y-2">
                        <label className="font-medium text-slate-700 text-sm">Back of ID</label>
                        <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                            {idBackPreview ? <img src={idBackPreview} alt="ID Back Preview" className="h-full w-full object-contain" /> : <span className="text-slate-500 text-xs">Back Preview</span>}
                        </div>
                        <SecondaryButton type="button" onClick={() => { setCameraTarget('id_back'); setIsCameraOpen(true); }} className="w-full !py-2 !text-sm"><CameraIcon /> Capture Back</SecondaryButton>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-medium text-slate-700 text-sm">Your Photo (Selfie)</label>
                    <div className="w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {faceImagePreview ? <img src={faceImagePreview} alt="Face Preview" className="h-full w-full object-contain" /> : <span className="text-slate-500 text-sm">Face Preview</span>}
                    </div>
                    <SecondaryButton type="button" onClick={() => { setCameraTarget('face'); setIsCameraOpen(true); }} className="w-full !py-2 !text-sm"><CameraIcon /> Take Picture of Face</SecondaryButton>
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
export default function Register() {
    const [step, setStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(true);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [termsViewed, setTermsViewed] = useState(false);
    const formContainerRef = useRef(null);
    const formRef = useRef(null);
    const [locations, setLocations] = useState(null);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);

    const { data, setData, post, processing, errors, reset, clearErrors, setError } = useForm({
        first_name: '', last_name: '', middle_name: '', suffix: '',
        province: '', city: '', barangay: '', street_address: '',
        phone_number: '', birthday: '', gender: '', civil_status: '',
        email: '', password: '', password_confirmation: '',
        valid_id_type: '',
        valid_id_front_image: null,
        valid_id_back_image: null,
        face_image: null,
    });

    // --- Fetch Location Data ---
    useEffect(() => {
    fetch('/ph_locations.json')
        .then(response => response.json())
        .then(locationData => {
            setLocations(locationData);
            setIsLoadingLocations(false);
            setData(prevData => ({
                ...prevData,
                province: 'Nueva Ecija',
                city: 'City of Gapan'
            }));
        })
        .catch(error => {
            console.error("Failed to load location data:", error);
            setIsLoadingLocations(false);
        });
}, []);

    // --- Validations ---
    const passwordValidation = useMemo(() => getPasswordValidationState(data.password), [data.password]);
    const passwordsDoNotMatch = data.password_confirmation && data.password !== data.password_confirmation;
    const [phoneValidation, setPhoneValidation] = useState({ status: 'idle', message: '' });
    const [emailValidation, setEmailValidation] = useState({ status: 'idle', message: '' });

    const ageValidation = useMemo(() => {
        return { isValid: true, message: '' };
    }, [data.birthday]);

    const stepFields = {
        1: ['first_name', 'last_name'],
        2: ['province', 'city', 'barangay', 'street_address', 'phone_number', 'birthday', 'gender', 'civil_status'],
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

        const formData = {
            ...data,
            phone_number: `+63${data.phone_number}`
        };

        post(route('register'), {
            data: formData,
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

    useEffect(() => {
        if (formContainerRef.current) {
            formContainerRef.current.scrollTop = 0;
        }
    }, [step]);

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1_BasicInfo data={data} setData={setData} errors={errors} />;
            case 2: return <Step2_PersonalDetails data={data} setData={setData} errors={errors} phoneValidation={phoneValidation} locations={locations} isLoadingLocations={isLoadingLocations}/>;
            case 3: return <Step3_AccountCredentials data={data} setData={setData} errors={errors} passwordVisible={passwordVisible} setPasswordVisible={setPasswordVisible} confirmPasswordVisible={confirmPasswordVisible} setConfirmPasswordVisible={setConfirmPasswordVisible} passwordsDoNotMatch={passwordsDoNotMatch} emailValidation={emailValidation} />;
            case 4: return <Step4_Verification data={data} setData={setData} errors={errors} termsViewed={termsViewed} agreeToTerms={agreeToTerms} setAgreeToTerms={setAgreeToTerms} setIsTermsModalOpen={setIsTermsModalOpen} />;
            default: return null;
        }
    };
    
    const handleTermsClose = () => {
        setIsTermsModalOpen(false);
        setTermsViewed(true);
        setAgreeToTerms(true);
    };

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
                        <AuthLayout title="Brgy. San Lorenzo" description="Join our community portal. Register for an account to access barangay services, announcements, and more." />
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
                                                 <PrimaryButton type="submit" disabled={processing}>Register</PrimaryButton>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="mt-auto pt-16 text-center">
                                <p className="text-sm text-slate-600">Already have an account?{' '} <Link href={route('login')} className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Sign in here</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}