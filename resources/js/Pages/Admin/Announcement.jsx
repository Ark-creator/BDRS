import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, router } from "@inertiajs/react";
import { useState, useEffect } from 'react';
import clsx from 'clsx';

// --- NEW DEPENDENCIES (Install via npm/yarn) ---
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Components ---
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

// --- Icons ---
import { Megaphone, Tag, Link2, CalendarDays, User, Edit, Trash2, UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function Announcement({ auth, announcements = [] }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        tag: '',
        title: '',
        description: '',
        link: '',
        image: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.announcements.store'), {
            onSuccess: () => {
                reset();
                setImagePreview(null);
                toast.success('Announcement created successfully!');
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6', // Blue
            cancelButtonColor: '#64748B',  // Slate
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.announcements.destroy', id), {
                    onSuccess: () => {
                        toast.success('Announcement deleted successfully!');
                    },
                    onError: () => {
                        toast.error('Failed to delete announcement.');
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Announcements Management" />
            
            <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />

            <div className="py-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <div className="lg:col-span-1">
                            <div className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-sky-100 dark:bg-sky-900/50 p-3 rounded-xl">
                                        <Megaphone className="h-6 w-6 text-blue-600 dark:text-sky-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Announcement</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Fill out the form to post a new update.</p>
                                    </div>
                                </div>
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input id="tag" name="tag" value={data.tag} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('tag', e.target.value)} required placeholder="e.g., Community Event" />
                                        <InputError message={errors.tag} className="mt-2" />
                                    </div>
                                    <input id="title" name="title" value={data.title} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('title', e.target.value)} required placeholder="Announcement Title" />
                                    <InputError message={errors.title} className="mt-2" />

                                    <textarea id="description" name="description" value={data.description} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('description', e.target.value)} required rows="4" placeholder="What is this announcement about?"></textarea>
                                    <InputError message={errors.description} className="mt-2" />

                                    <div className="relative">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input id="link" name="link" type="url" value={data.link} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('link', e.target.value)} placeholder="https://example.com (optional)" />
                                        <InputError message={errors.link} className="mt-2" />
                                    </div>

                                    <div className="p-4 border-2 border-blue-300/50 dark:border-sky-700/50 border-dashed rounded-xl text-center cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                                        <label htmlFor="image" className="cursor-pointer">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="mx-auto h-28 w-auto rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 dark:text-slate-400">
                                                    <UploadCloud className="h-10 w-10" />
                                                    <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                                                    <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            )}
                                            <input id="image" name="image" type="file" className="sr-only" onChange={handleFileChange} required />
                                        </label>
                                    </div>
                                    <InputError message={errors.image} className="mt-2" />
                                    
                                    {progress && (
                                        <div className="w-full bg-sky-100 rounded-full dark:bg-slate-700">
                                            <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${progress.percentage}%` }}>
                                                {progress.percentage}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 pt-2 ">
                                        <PrimaryButton disabled={processing} className="w-full justify-center ">
                                            {processing ? 'Creating...' : 'Create Announcement'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            {announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row transition-shadow duration-300 hover:shadow-blue-500/20">
                                        <img src={announcement.image_url} alt={announcement.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover" />
                                        <div className="p-6 flex flex-col justify-between flex-1">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{announcement.tag}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button title="Edit" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={16} /></button>

                                                        <button onClick={() => handleDelete(announcement.id)} title="Delete" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{announcement.title}</h4>
                                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{announcement.description}</p>
                                                {announcement.link && (
                                                    <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                        Learn More <Link2 size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} />
                                                    <span>{announcement.user?.full_name || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays size={14} />
                                                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="lg:col-span-2 flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <ImageIcon className="h-16 w-16 text-sky-300 dark:text-sky-700" />
                                    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">No Announcements Yet</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create the first announcement using the form.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}