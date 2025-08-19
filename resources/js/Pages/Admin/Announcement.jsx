import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, router } from "@inertiajs/react";
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { Megaphone, Tag, Link2, CalendarDays, User, Edit, Trash2, UploadCloud, Image as ImageIcon, X } from 'lucide-react';

// ====================================================================
// ===== EDIT MODAL COMPONENT (Nasa loob na ng file na ito) =========
// ====================================================================
function EditModal({ announcement, isOpen, onClose }) {
    const [imagePreview, setImagePreview] = useState(announcement.image_url);
    const { data, setData, post, processing, errors, progress } = useForm({
        tag: announcement.tag || '',
        title: announcement.title || '',
        description: announcement.description || '',
        link: announcement.link || '',
        image: null,
        _method: 'PATCH'
    });

    useEffect(() => {
        setData({
            tag: announcement.tag || '',
            title: announcement.title || '',
            description: announcement.description || '',
            link: announcement.link || '',
            image: null,
            _method: 'PATCH'
        });
        setImagePreview(announcement.image_url);
    }, [announcement]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        post(route('admin.announcements.update', announcement.id), {
            onSuccess: () => {
                onClose();
                toast.success('Announcement updated successfully!');
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={submitUpdate}>
                    <div className="p-6 flex justify-between items-center border-b dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Announcement</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input value={data.tag} onChange={(e) => setData('tag', e.target.value)} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg" required />
                        </div>
                        <InputError message={errors.tag} className="-mt-3 ml-2" />
                        <input value={data.title} onChange={(e) => setData('title', e.target.value)} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg" placeholder="Announcement Title" required />
                        <InputError message={errors.title} className="mt-2" />
                        <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg" placeholder="What is this announcement about?" required rows="4"></textarea>
                        <InputError message={errors.description} className="mt-2" />
                        <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input type="url" value={data.link} onChange={(e) => setData('link', e.target.value)} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg" placeholder="https://example.com (optional)" />
                        </div>
                        <InputError message={errors.link} className="mt-2" />
                        <label className="p-4 border-2 border-dashed rounded-xl text-center cursor-pointer block hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
                            <img src={imagePreview} alt="Preview" className="mx-auto h-28 w-auto rounded-lg object-cover mb-2" />
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Click to change image</span>
                            <input type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <InputError message={errors.image} className="mt-2" />
                        {progress && <div className="w-full bg-sky-100 rounded-full"><div className="bg-blue-600 text-xs p-0.5 text-center rounded-full" style={{ width: `${progress.percentage}%` }}>{progress.percentage}%</div></div>}
                    </div>
                    <div className="p-6 flex justify-end items-center gap-4 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <PrimaryButton disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ====================================================================
// ===== MAIN ANNOUNCEMENT COMPONENT ==================================
// ====================================================================
export default function Announcement({ auth, announcements: paginatedAnnouncements = { data: [], links: [], total: 0, per_page: 0 } }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const [imagePreview, setImagePreview] = useState(null);
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        tag: '', title: '', description: '', link: '', image: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image', file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => { return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.announcements.store'), {
            onSuccess: () => {
                reset();
                setImagePreview(null);
                if (document.getElementById('image')) document.getElementById('image').value = '';
                toast.success('Announcement created successfully!');
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#3B82F6', cancelButtonColor: '#64748B', confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.announcements.destroy', id), {
                    onSuccess: () => toast.success('Announcement deleted successfully!'),
                    onError: () => toast.error('Failed to delete announcement.'),
                    preserveScroll: true,
                });
            }
        });
    };

    const handleEditClick = (announcement) => {
        setEditingAnnouncement(announcement);
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => setIsEditModalOpen(false);

    const announcements = paginatedAnnouncements.data;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Announcements Management" />
            <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />

            {isEditModalOpen && (
                <EditModal
                    announcement={editingAnnouncement}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseModal}
                />
            )}

            <div className="py-12 bg-slate-50 dark:bg-slate-900 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* --- Create Announcement Form Column --- */}
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
                                    </div>
                                    <InputError message={errors.tag} className="mt-2" />
                                    <div>
                                        <input id="title" name="title" value={data.title} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('title', e.target.value)} required placeholder="Announcement Title" />
                                        <InputError message={errors.title} className="mt-2" />
                                    </div>
                                    <div>
                                        <textarea id="description" name="description" value={data.description} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('description', e.target.value)} required rows="4" placeholder="What is this announcement about?"></textarea>
                                        <InputError message={errors.description} className="mt-2" />
                                    </div>
                                    <div className="relative">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input id="link" name="link" type="url" value={data.link} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('link', e.target.value)} placeholder="https://example.com (optional)" />
                                        <InputError message={errors.link} className="mt-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="image" className="p-4 border-2 border-blue-300/50 dark:border-sky-700/50 border-dashed rounded-xl text-center cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors block">
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
                                        <InputError message={errors.image} className="mt-2" />
                                    </div>
                                    {progress && (
                                        <div className="w-full bg-sky-100 rounded-full dark:bg-slate-700"><div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${progress.percentage}%` }}>{progress.percentage}%</div></div>
                                    )}
                                    <div className="flex items-center gap-4 pt-2 "><PrimaryButton disabled={processing} className="w-full justify-center">{processing ? 'Creating...' : 'Create Announcement'}</PrimaryButton></div>
                                </form>
                            </div>
                        </div>

                        {/* --- Announcements List Column --- */}
                        <div className="lg:col-span-2 space-y-6">
                            {announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    // ===== DITO IBINALIK ANG DETALYADONG STYLING =====
                                    <div key={announcement.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl overflow-hidden flex flex-col md:flex-row transition-shadow duration-300 hover:shadow-blue-500/20">
                                        <img src={announcement.image_url} alt={announcement.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover" />
                                        <div className="p-6 flex flex-col justify-between flex-1">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{announcement.tag}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => handleEditClick(announcement)} title="Edit" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={16} /></button>
                                                        <button onClick={() => handleDelete(announcement.id)} title="Delete" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{announcement.title}</h4>
                                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{announcement.description}</p>
                                                {announcement.link && (
                                                    <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">Learn More <Link2 size={14} /></a>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-2"><User size={14} /><span>{announcement.user?.full_name || 'Unknown'}</span></div>
                                                <div className="flex items-center gap-2"><CalendarDays size={14} /><span>{new Date(announcement.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
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

                             {/* --- Pagination Links --- */}
                            {paginatedAnnouncements.total > paginatedAnnouncements.per_page && (
                                <div className="mt-6">
                                    <div className="flex justify-center space-x-1">
                                        {paginatedAnnouncements.links.map((link, index) => (
                                            link.url ? (
                                                <Link key={index} href={link.url} preserveScroll className={clsx('px-4 py-2 text-sm rounded-lg transition', link.active ? 'bg-blue-600 text-white font-bold' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')} dangerouslySetInnerHTML={{ __html: link.label }} />
                                            ) : (
                                                <span key={index} className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}