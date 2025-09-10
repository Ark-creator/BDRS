import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { Users, Camera, X, CheckCircle, Phone, MapPin, Mail, ImageUp, Building, Contact, Trash2 } from 'lucide-react';

//================================================================
// ✨ Polished & Professional Reusable UI Components ✨
//================================================================

const PageHeader = ({ title, description }) => (
    <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl mx-auto text-md text-slate-600 dark:text-slate-400">{description}</p>}
    </div>
);

const Tabs = ({ tabs, activeTab, setActiveTab }) => (
    <div className="mb-6 flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex space-x-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                        'relative flex items-center gap-2 whitespace-nowrap rounded-md py-2 px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
                        activeTab !== tab.id && 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                    )}
                >
                    {activeTab === tab.id &&
                        <motion.div layoutId="active-pill" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm" />
                    }
                    <span className="relative z-10"><tab.icon className="inline-block h-5 w-5" /></span>
                    <span className="relative z-10">{tab.label}</span>
                </button>
            ))}
        </div>
    </div>
);

const Card = ({ children }) => ( <div className="bg-white dark:bg-slate-800/50 shadow-lg ring-1 ring-black/5 rounded-2xl">{children}</div> );
const FormRow = ({ children }) => ( <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-start"> {children} </div> );
const FormLabel = ({ title, description }) => ( <div className="md:col-span-1 pt-1"><h4 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h4>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div> );
const FormControl = ({ children }) => <div className="md:col-span-2">{children}</div>;
const InputField = ({ name, value, onChange, type = 'text', ...props }) => { const InputComponent = type === 'textarea' ? 'textarea' : 'input'; return ( <InputComponent id={name} name={name} type={type} value={value || ''} onChange={onChange} className={clsx("block w-full rounded-md bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out", type === 'textarea' ? 'py-2 px-3' : 'h-10 px-3')} {...props} /> ); };
const ImageUploader = ({ currentImageUrl, onImageChange, onImageRemove, shape = 'square' }) => { const shapeClasses = { square: 'rounded-full w-40 h-40', circle: 'rounded-full w-24 h-24' }; return ( <div className="flex items-center gap-5"> <div className={clsx("flex-shrink-0 bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600", shapeClasses[shape])}>{currentImageUrl ? ( <img src={currentImageUrl} alt="Preview" className={clsx("h-full w-full object-cover", shapeClasses[shape])} /> ) : ( <ImageUp className="h-8 w-8 text-slate-400" /> )}</div> <div className="flex items-center gap-2"><label className="cursor-pointer rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600/80 transition-colors"><span>Upload File</span><input type="file" className="sr-only" onChange={onImageChange} accept="image/*" /></label>{currentImageUrl && ( <button type="button" onClick={onImageRemove} className="p-2 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={16} /></button> )}</div></div> ); };
const CardFooter = ({ children }) => ( <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700/50 rounded-b-2xl flex justify-end items-center gap-4">{children}</div>);

const SuccessToast = ({ show, onDismiss }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
                className="fixed top-24 right-6 w-full max-w-sm z-50"
            >
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 text-green-500">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Saved Successfully!</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your changes have been updated.</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button onClick={onDismiss} className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default function SuperAdminSettings({ auth, initialSettingsData }) {
    const { data, setData, post, processing, isDirty, reset } = useForm(() => {
        const safeData = initialSettingsData || {};
        const officials = Array.isArray(safeData.officials) ? safeData.officials : [];
        const filledOfficials = Array(3).fill(null).map((_, i) => officials[i] || { name: '', position: '', photo_url: '' });

        return {
            ...safeData,
            footer_title: safeData.footer_title || '',
            footer_subtitle: safeData.footer_subtitle || '',
            footer_logo_url: safeData.footer_logo_url || '',
            footer_address: safeData.footer_address || '',
            footer_email: safeData.footer_email || '',
            footer_phone: safeData.footer_phone || '',
            officials: filledOfficials,
            footer_logo_file: null,
            officials_files: [null, null, null],
            _method: 'PATCH',
        };
    });
    
    const [activeTab, setActiveTab] = useState('officials');
    const [showToast, setShowToast] = useState(false);

    const handleInputChange = (e) => setData(e.target.name, e.target.value);
    const handleLogoFileChange = (e) => { const file = e.target.files[0]; if (file) setData(data => ({ ...data, footer_logo_file: file, footer_logo_url: URL.createObjectURL(file) })); };
    const handleLogoRemoveImage = () => setData(data => ({ ...data, footer_logo_file: 'remove', footer_logo_url: null }));
    const handleOfficialChange = (index, field, value) => setData('officials', data.officials.map((official, i) => i === index ? { ...official, [field]: value } : official));
    const handleOfficialFileChange = (e, index) => { const file = e.target.files[0]; if (file) { let newFiles = [...data.officials_files]; newFiles[index] = file; setData(data => ({ ...data, officials_files: newFiles, officials: data.officials.map((official, i) => i === index ? { ...official, photo_url: URL.createObjectURL(file) } : official) })); } };
    const handleOfficialFileRemove = (index) => { let newFiles = [...data.officials_files]; newFiles[index] = 'remove'; setData(data => ({ ...data, officials_files: newFiles, officials: data.officials.map((official, i) => i === index ? { ...official, photo_url: null } : official) })); };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('superadmin.settings.update'), {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => { console.error("Submission failed:", errors); },
            onSuccess: () => {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000); 
            },
        });
    };

    const tabs = [
        { id: 'officials', label: 'Officials', icon: Users },
        { id: 'branding', label: 'Branding', icon: Building },
        { id: 'contact', label: 'Contact Info', icon: Contact },
    ];
    
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Welcome Page Settings" />
            
            <SuccessToast show={showToast} onDismiss={() => setShowToast(false)} />

            <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <PageHeader title="Welcome Page Settings" description="Manage the global content of the public-facing pages." />
                <form onSubmit={handleSubmit}>
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
                    
                    <Card>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                                className="divide-y divide-slate-200/80 dark:divide-slate-700/50"
                            >
                                {activeTab === 'officials' && (
                                    <>
                                        {data.officials.map((official, index) => (
                                            <FormRow key={index}>
                                                <FormLabel title={`Official #${index + 1}`} description={`Details for the ${['first', 'second', 'third'][index]} official.`} />
                                                <FormControl>
                                                    <div className="space-y-4">
                                                        <ImageUploader shape="circle" currentImageUrl={official.photo_url} onImageChange={(e) => handleOfficialFileChange(e, index)} onImageRemove={() => handleOfficialFileRemove(index)} />
                                                        <InputField name={`officials[${index}][name]`} value={official.name} onChange={(e) => handleOfficialChange(index, 'name', e.target.value)} placeholder="Hon. Juan Dela Cruz" />
                                                        <InputField name={`officials[${index}][position]`} value={official.position} onChange={(e) => handleOfficialChange(index, 'position', e.target.value)} placeholder="Position" />
                                                    </div>
                                                </FormControl>
                                            </FormRow>
                                        ))}
                                    </>
                                )}

                                {activeTab === 'branding' && (
                                    <>
                                        <FormRow><FormLabel title="Main Title" description="The primary name of your website." /><FormControl><InputField name="footer_title" value={data.footer_title} onChange={handleInputChange} /></FormControl></FormRow>
                                        <FormRow><FormLabel title="Subtitle" description="A short tagline or description." /><FormControl><InputField name="footer_subtitle" value={data.footer_subtitle} onChange={handleInputChange} /></FormControl></FormRow>
                                        <FormRow><FormLabel title="Website Logo" description="Appears in the header and footer." /><FormControl><ImageUploader currentImageUrl={data.footer_logo_url} onImageChange={handleLogoFileChange} onImageRemove={handleLogoRemoveImage} /></FormControl></FormRow>
                                    </>
                                )}

                                {activeTab === 'contact' && (
                                    <>
                                        <FormRow><FormLabel title="Address" description="The physical address of the main office." /><FormControl><InputField name="footer_address" value={data.footer_address} onChange={handleInputChange} type="textarea" rows={3} /></FormControl></FormRow>
                                        <FormRow><FormLabel title="Email" description="The official contact email." /><FormControl><InputField name="footer_email" value={data.footer_email} onChange={handleInputChange} type="email" /></FormControl></FormRow>
                                        <FormRow><FormLabel title="Phone Number" description="The official contact phone number." /><FormControl><InputField name="footer_phone" value={data.footer_phone} onChange={handleInputChange} /></FormControl></FormRow>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        
                        <CardFooter>
                            <button 
                                type="button" 
                                onClick={() => reset()} 
                                disabled={!isDirty || processing}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Discard
                            </button>
                            <button 
                                type="submit" 
                                disabled={!isDirty || processing} 
                                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </AuthenticatedLayout>
    );
}