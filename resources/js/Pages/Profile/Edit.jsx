import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import Footer from '@/Components/Residents/Footer';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icon = ({ path, className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const SettingsCard = ({ title, description, children }) => (
    <motion.div 
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg ring-1 ring-slate-900/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
    >
        <header>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
        </header>
        <div className="mt-6 border-t border-slate-200 pt-6">
            {children}
        </div>
    </motion.div>
);

export default function Edit({ auth, mustVerifyEmail, status }) {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', name: 'Profile', icon: <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
        { id: 'password', name: 'Password', icon: <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
        { id: 'danger', name: 'Danger Zone', icon: <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Profile Settings" />
            
            <div className="bg-sky-50 mt-6">
                <main className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                        <header>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
                            <p className="mt-2 text-lg text-slate-600">
                                Hi, <span className="font-semibold text-blue-600">{auth.user.full_name}</span>. Manage your account information and security settings.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                            <nav className="lg:col-span-1">
                                <ul className="flex lg:flex-col gap-2">
                                    {tabs.map(tab => (
                                        <li key={tab.id} className="flex-1 lg:flex-none">
                                            <button
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors relative ${
                                                    activeTab === tab.id
                                                        ? 'text-white'
                                                        : 'text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {activeTab === tab.id && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 bg-blue-600 rounded-lg shadow"
                                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                                <span className="relative z-10">{tab.icon}</span>
                                                <span className="relative z-10">{tab.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            <div className="lg:col-span-3">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'profile' && (
                                        <SettingsCard
                                            key="profile"
                                            title="Profile Information"
                                            description="Update your account's profile information and email address."
                                        >
                                            <UpdateProfileInformationForm
                                                mustVerifyEmail={mustVerifyEmail}
                                                status={status}
                                                className="max-w-xl"
                                            />
                                        </SettingsCard>
                                    )}

                                    {activeTab === 'password' && (
                                        <SettingsCard
                                            key="password"
                                            title="Update Password"
                                            description="Ensure your account is using a long, random password to stay secure."
                                        >
                                            <UpdatePasswordForm className="max-w-xl" />
                                        </SettingsCard>
                                    )}

                                    {activeTab === 'danger' && (
                                        <SettingsCard
                                            key="danger"
                                            title="Delete Account"
                                            description="Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain."
                                        >
                                            <DeleteUserForm className="max-w-xl" />
                                        </SettingsCard>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </AuthenticatedLayout>
    );
}
