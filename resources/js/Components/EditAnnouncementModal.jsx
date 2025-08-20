import { useForm } from "@inertiajs/react";
import { useState, useEffect } from 'react';
import PrimaryButton from "@/Components/PrimaryButton";
import InputError from "@/Components/InputError";
import { X, Tag, Link2, UploadCloud } from 'lucide-react';

export default function EditAnnouncementModal({ announcement, isOpen, onClose }) {
    const [imagePreview, setImagePreview] = useState(announcement.image_url);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        tag: announcement.tag || '',
        title: announcement.title || '',
        description: announcement.description || '',
        link: announcement.link || '',
        image: null, // Start with null, only set if user selects a new file
        _method: 'PATCH' // Important for Laravel to treat this POST as a PATCH
    });

    useEffect(() => {
        // Reset form data if the announcement prop changes
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
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        // Use `post` because of file upload, but `_method: 'PATCH'` will route it correctly
        post(route('admin.announcements.update', announcement.id), {
            onSuccess: () => {
                onClose(); // Close modal on success
                reset();
            },
            // You might want to keep the modal open on error to show messages
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={submit} className="space-y-5">
                    {/* Modal Header */}
                    <div className="p-6 flex justify-between items-center border-b dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Announcement</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        {/* Fields are similar to the create form */}
                         <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input id="edit-tag" name="tag" value={data.tag} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('tag', e.target.value)} required />
                        </div>
                        <InputError message={errors.tag} className="-mt-3 ml-2" />

                        <div>
                            <input id="edit-title" name="title" value={data.title} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('title', e.target.value)} required />
                             <InputError message={errors.title} className="mt-2" />
                        </div>

                        <div>
                            <textarea id="edit-description" name="description" value={data.description} className="w-full border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('description', e.target.value)} required rows="4"></textarea>
                            <InputError message={errors.description} className="mt-2" />
                        </div>
                        
                        <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input id="edit-link" name="link" type="url" value={data.link} className="w-full pl-10 border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-700/50 rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setData('link', e.target.value)} />
                            <InputError message={errors.link} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="edit-image" className="p-4 border-2 border-blue-300/50 dark:border-sky-700/50 border-dashed rounded-xl text-center cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors block">
                                <img src={imagePreview} alt="Preview" className="mx-auto h-28 w-auto rounded-lg object-cover mb-2" />
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Click to change image</span>
                                <input id="edit-image" name="image" type="file" className="sr-only" onChange={handleFileChange} />
                            </label>
                            <InputError message={errors.image} className="mt-2" />
                        </div>

                        {progress && (
                            <div className="w-full bg-sky-100 rounded-full dark:bg-slate-700"><div className="bg-blue-600 text-xs p-0.5 text-center rounded-full" style={{ width: `${progress.percentage}%` }}>{progress.percentage}%</div></div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 flex justify-end items-center gap-4 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
}