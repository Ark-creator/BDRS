import React, { useRef, useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Save, CheckCircle2, Eye, EyeOff, XCircle, Check } from 'lucide-react';
import clsx from 'clsx';

// --- Reusable UI Components (Self-Contained) ---

const InputLabel = ({ htmlFor, value, className, children }) => (
    <label htmlFor={htmlFor} className={clsx('block font-semibold text-sm text-gray-700 dark:text-gray-300', className)}>
        {value || children}
    </label>
);

const TextInput = React.forwardRef(({ type = 'text', className, icon, toggleVisibility, ...props }, ref) => (
    <div className="relative mt-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
        </div>
        <input
            {...props}
            type={type}
            ref={ref}
            className={clsx(
                'block w-full border-gray-300 dark:border-slate-600 dark:bg-slate-900/50 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500 rounded-md shadow-sm transition duration-150 ease-in-out pl-10',
                toggleVisibility ? 'pr-10' : '',
                className
            )}
        />
        {toggleVisibility && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {toggleVisibility}
            </div>
        )}
    </div>
));

const InputError = ({ message, className }) => (
    message ? <p className={clsx('text-sm text-red-600 dark:text-red-400 mt-2', className)}>{message}</p> : null
);

const PrimaryButton = ({ className = '', disabled, children, icon, ...props }) => (
    <button
        {...props}
        disabled={disabled}
        className={clsx(
            'inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition ease-in-out duration-150',
            disabled && 'opacity-50 cursor-not-allowed',
            className
        )}
    >
        {icon}
        {children}
    </button>
);

// --- New Toast Notification Component ---
const Toast = ({ message, show, onDismiss }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 3000); // Auto-dismiss after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onDismiss]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
                    className="fixed top-5 right-5 z-50"
                >
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 border dark:border-slate-700">
                        <CheckCircle2 className="text-green-500" />
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- New Password Requirements Checklist ---
const PasswordRequirement = ({ isValid, text }) => (
    <li className={clsx("flex items-center gap-2 text-xs transition-colors", isValid ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400")}>
        {isValid ? <Check size={14} /> : <XCircle size={14} />}
        <span>{text}</span>
    </li>
);

const PasswordRequirements = ({ password }) => {
    const checks = {
        length: password.length >= 8 && password.length <= 16,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    return (
        <ul className="mt-3 space-y-1">
            <PasswordRequirement isValid={checks.length} text="8-16 characters long" />
            <PasswordRequirement isValid={checks.lowercase} text="At least one lowercase letter" />
            <PasswordRequirement isValid={checks.uppercase} text="At least one uppercase letter" />
            <PasswordRequirement isValid={checks.number} text="At least one number" />
            <PasswordRequirement isValid={checks.special} text="At least one special character" />
        </ul>
    );
};

// --- New Password Match Indicator ---
const PasswordMatchIndicator = ({ password, confirmation }) => {
    if (confirmation.length === 0) {
        return null;
    }

    const passwordsMatch = password === confirmation;

    return (
        <div className={clsx("mt-2 text-sm flex items-center gap-2", passwordsMatch ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
            {passwordsMatch ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
        </div>
    );
};


// --- Main Update Password Form Component ---

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const { data, setData, errors, put, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowToast(true);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <Toast message="Password updated successfully!" show={showToast} onDismiss={() => setShowToast(false)} />
            <form onSubmit={updatePassword} className="space-y-6">
                 <h2 className="text-xl font-bold font-lg text-blue-700">
                    Change Password
                </h2>
                <div>
                    <InputLabel htmlFor="current_password" value="Current Password" />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full"
                        autoComplete="current-password"
                        icon={<Lock size={16} className="text-gray-400" />}
                        toggleVisibility={
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />
                    <InputError message={errors.current_password} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full"
                        autoComplete="new-password"
                        icon={<Lock size={16} className="text-gray-400" />}
                        toggleVisibility={
                             <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />
                    <PasswordRequirements password={data.password} />
                    <InputError message={errors.password} />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm New Password" />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full"
                        autoComplete="new-password"
                        icon={<Lock size={16} className="text-gray-400" />}
                        toggleVisibility={
                             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />
                    <PasswordMatchIndicator password={data.password} confirmation={data.password_confirmation} />
                    <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <PrimaryButton disabled={processing} icon={<Save size={14} />}>
                        Save Password
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
