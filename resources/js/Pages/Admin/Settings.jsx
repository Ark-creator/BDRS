import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

// --- Icons ---
import { 
    Building, BookOpen, Users, Phone, Camera, User, Briefcase, 
    PenSquare, Mail, MapPin, Globe, UploadCloud, X, Trash2, CheckCircle
} from 'lucide-react';

//================================================================
// Reusable UI Components
//================================================================

const Card = ({ children, className }) => (
    <div className={clsx("bg-white dark:bg-slate-800/50 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50 rounded-lg", className)}>
        {children}
    </div>
);

const CardHeader = ({ title, description }) => (
    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
);

const CardContent = ({ children, className }) => <div className={clsx("p-6", className)}>{children}</div>;

const InputField = ({ label, name, value, onChange, icon: Icon, type = 'text', helpText, ...props }) => {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {label}
            </label>
            <div className="relative">
                {Icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon className="h-5 w-5 text-slate-400" /></div>}
                <InputComponent
                    id={name} name={name} type={type} value={value || ''} onChange={onChange}
                    className={clsx(
                        "block w-full rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
                        Icon ? 'pl-10' : 'px-3',
                        type === 'textarea' ? 'py-2' : 'h-10'
                    )}
                    {...props}
                />
            </div>
            {helpText && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helpText}</p>}
        </div>
    );
};

const ImageUploader = ({ label, currentImageUrl, onImageChange, onImageRemove, shape = 'square' }) => {
    const shapeClasses = {
        square: 'rounded-md',
        circle: 'rounded-full'
    };
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            <div className="flex items-center gap-4">
                <img 
                    src={currentImageUrl || '/images/placeholder.svg'} 
                    alt="Preview" 
                    className={clsx('object-cover bg-slate-100 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900', shapeClasses[shape], shape === 'circle' ? 'w-16 h-16' : 'w-24 h-16')} 
                />
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        <Camera size={16} className="inline-block -mt-px mr-2" />
                        <span>Change</span>
                        <input type="file" className="sr-only" onChange={onImageChange} accept="image/*" />
                    </label>
                    {currentImageUrl && (
                        <button type="button" onClick={onImageRemove} className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


//================================================================
// Main Settings Component
//================================================================

export default function SettingsPage({ auth, initialSettingsData }) {
    // Let's assume initialSettingsData is passed from the controller
     const initialSettings = {
        header_footer_text: 'Barangay San Lorenzo',
        logo_url: '/images/gapanlogo.png',
        vision_text: 'To be a progressive and self-reliant community where residents live in a peaceful, orderly, and environmentally-balanced society.',
        mission_text: 'To deliver efficient and effective public service, promote economic growth, and ensure the general welfare and safety of our constituents through good governance.',
        goal_text: 'To implement programs and projects that will uplift the quality of life of every resident in Barangay San Lorenzo.',
        officials: [
            { name: 'Hon. Juan Dela Cruz', position: 'Punong Barangay', photo_url: '/images/avatar-male.png' },
            { name: 'Hon. Maria Clara', position: 'Head Kagawad', photo_url: '/images/avatar-female.png' },
            { name: 'Hon. Jose Rizal', position: 'Barangay Treasurer', photo_url: '/images/avatar-male.png' },
        ],
        contact_page_phone: '(044) 329-6240',
        contact_page_email: 'brgy.sanlorenzo@gapan.gov.ph',
        contact_page_address: 'Brgy. Hall, San Lorenzo, Gapan City, Nueva Ecija 3105',
        google_maps_embed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3846.130635209788!2d120.9478333153432!3d15.42289998928424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397262a5db58673%3A0x863a3525287399ab!2sSan%20Lorenzo%20Barangay%20Hall!5e0!3m2!1sen!2sph!4v1662692823050!5m2!1sen!2sph" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
        footer_address: 'Brgy. Hall, San Lorenzo, Gapan City, 3105',
        footer_email: 'contact@sanlorenzo.gov.ph',
        footer_phone: '(044) 329-6240',
    };

    const { data, setData, post, processing, errors, isDirty, reset } = useForm({
        ...initialSettings,
        logo_file: null,
        officials_files: [null, null, null],
        _method: 'PATCH', // For Laravel to handle it as an update
    });
    
    const [activeTab, setActiveTab] = useState('identity');
    const [showToast, setShowToast] = useState(false);

    const handleFileChange = (e, name) => {
        const file = e.target.files[0];
        if (!file) return;

        if (name === 'logo_file') {
            setData({ ...data, logo_file: file, logo_url: URL.createObjectURL(file) });
        } else {
            const index = parseInt(name.split('_')[2]);
            const newFiles = [...data.officials_files];
            const newOfficials = [...data.officials];
            newFiles[index] = file;
            newOfficials[index].photo_url = URL.createObjectURL(file);
            setData({ ...data, officials_files: newFiles, officials: newOfficials });
        }
    };
    
    const handleRemoveImage = (name) => {
         if (name === 'logo_file') {
            setData({ ...data, logo_file: null, logo_url: null }); // Set to null or a placeholder path
        } else {
            const index = parseInt(name.split('_')[2]);
            const newFiles = [...data.officials_files];
            const newOfficials = [...data.officials];
            newFiles[index] = null;
            newOfficials[index].photo_url = null; // Set to null or a placeholder path
            setData({ ...data, officials_files: newFiles, officials: newOfficials });
        }
    };

    const handleInputChange = (e) => setData(e.target.name, e.target.value);

    const handleOfficialChange = (index, field, value) => {
        const updatedOfficials = [...data.officials];
        updatedOfficials[index][field] = value;
        setData('officials', updatedOfficials);
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        // The actual route would be something like 'settings.update'
        post(route('superadmin.settings.update'), {
            onSuccess: () => {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                reset(); // Resets the form to its initial state, making isDirty false
            },
            onError: (errors) => {
                console.error("Submission failed:", errors);
            }
        });
    };

    const navItems = [
        { id: 'identity', label: 'Site Identity', icon: Building },
        { id: 'about', label: 'About Page', icon: BookOpen },
        { id: 'officials', label: 'Barangay Officials', icon: Users },
        { id: 'contact', label: 'Contact & Footer', icon: Phone },
    ];

    const tabContent = {
        identity: (
            <Card>
                <CardHeader title="Site Identity" description="Manage the website's logo and main header text." />
                <CardContent className="space-y-8">
                    <InputField label="Header & Footer Title (H1)" name="header_footer_text" value={data.header_footer_text} onChange={handleInputChange} icon={PenSquare} />
                    <ImageUploader label="Barangay Logo" currentImageUrl={data.logo_url} onImageChange={(e) => handleFileChange(e, 'logo_file')} onImageRemove={() => handleRemoveImage('logo_file')} shape="square"/>
                </CardContent>
            </Card>
        ),
        about: (
            <Card>
                <CardHeader title="About Page Content" description="Edit the Vision, Mission, and Goal displayed on the 'About' page." />
                <CardContent className="space-y-6">
                    <InputField label="Our Vision" name="vision_text" value={data.vision_text} onChange={handleInputChange} type="textarea" rows="4" />
                    <InputField label="Our Mission" name="mission_text" value={data.mission_text} onChange={handleInputChange} type="textarea" rows="4" />
                    <InputField label="Our Goal" name="goal_text" value={data.goal_text} onChange={handleInputChange} type="textarea" rows="4" />
                </CardContent>
            </Card>
        ),
        officials: (
             <Card>
                <CardHeader title="Main Barangay Officials" description="Update the three primary officials featured on the website." />
                <CardContent className="space-y-8 divide-y divide-slate-200 dark:divide-slate-700">
                    {data.officials.map((official, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 first:pt-0">
                            <div className="md:col-span-1">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Official #{index + 1}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Update photo and details.</p>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                               <ImageUploader label="Photo" currentImageUrl={official.photo_url} onImageChange={(e) => handleFileChange(e, `official_file_${index}`)} onImageRemove={() => handleRemoveImage(`official_file_${index}`)} shape="circle" />
                                <InputField label="Full Name" name={`official_name_${index}`} value={official.name} onChange={(e) => handleOfficialChange(index, 'name', e.target.value)} icon={User} />
                                <InputField label="Position" name={`official_position_${index}`} value={official.position} onChange={(e) => handleOfficialChange(index, 'position', e.target.value)} icon={Briefcase} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        ),
        contact: (
            <div className="space-y-8">
                <Card>
                    <CardHeader title="Contact Page Details" description="Information that will appear on the 'Contact Us' page." />
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Contact Page Email" name="contact_page_email" value={data.contact_page_email} onChange={handleInputChange} icon={Mail} type="email" />
                            <InputField label="Contact Page Phone" name="contact_page_phone" value={data.contact_page_phone} onChange={handleInputChange} icon={Phone} />
                        </div>
                        <InputField label="Office Address" name="contact_page_address" value={data.contact_page_address} onChange={handleInputChange} icon={MapPin} type="textarea" rows="3" />
                        <InputField label="Google Maps Embed HTML" name="google_maps_embed" value={data.google_maps_embed} onChange={handleInputChange} icon={Globe} type="textarea" rows="5" 
                            helpText="Go to Google Maps, find the address, click 'Share' > 'Embed a map', and copy the HTML code here."
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader title="Footer Content" description="Brief contact info displayed at the bottom of every page." />
                    <CardContent className="space-y-6">
                        <InputField label="Footer Address" name="footer_address" value={data.footer_address} onChange={handleInputChange} icon={MapPin} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Footer Email" name="footer_email" value={data.footer_email} onChange={handleInputChange} icon={Mail} type="email" />
                            <InputField label="Footer Phone Number" name="footer_phone" value={data.footer_phone} onChange={handleInputChange} icon={Phone} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Website Content" />

            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* --- Main Page Header --- */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Content Management</h1>
                    <p className="mt-2 text-md text-slate-600 dark:text-slate-400">Update the public-facing content of the website from one place.</p>
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Left Navigation */}
                    <aside className="lg:col-span-3 mb-6 lg:mb-0">
                        <nav className="space-y-1">
                            {navItems.map(item => (
                                <button key={item.id} onClick={() => setActiveTab(item.id)}
                                    className={clsx( "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 text-left",
                                        activeTab === item.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 mr-3 shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Right Content Panel with Animation */}
                    <main className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                            >
                                {tabContent[activeTab]}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </main>

            {/* --- Sticky Action Bar --- */}
            <AnimatePresence>
                {isDirty && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed bottom-0 inset-x-0 z-50"
                    >
                        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-4">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg shadow-2xl ring-1 ring-slate-300/50 dark:ring-slate-700/50 flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">You have unsaved changes.</p>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => reset()} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Discard</button>
                                    <button onClick={handleSubmit} disabled={processing} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Toast Notification --- */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed top-24 right-6 w-full max-w-sm z-50"
                    >
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 text-green-500"><CheckCircle className="h-6 w-6" /></div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Content Saved!</p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your changes have been successfully updated.</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex"><button onClick={() => setShowToast(false)} className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"><X className="h-5 w-5" /></button></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}