import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { useDebounce } from 'use-debounce';
import clsx from 'clsx';
import { toast, Toaster } from 'react-hot-toast';

// --- DRIVER.JS IMPORTS ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- ICONS ---
import { Search, History as HistoryIcon, User, FileText, CalendarDays, HelpCircle, FileQuestion, MessageSquare, RotateCcw, AlertTriangle } from 'lucide-react';

// --- Reusable Components ---

const StatusBadge = ({ status }) => {
    const colors = {
        'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        'Claimed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    return (
        <span className={clsx('px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-x-1.5', colors[status] || 'bg-gray-200')}>
            <span className={clsx('h-1.5 w-1.5 rounded-full', colors[status]?.replace(/text-(green|red)-[0-9]{2,3}/, 'bg-$1-500').split(' ')[1])}></span>
            {status}
        </span>
    );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                        </div>
                        <div className="mt-0 text-left">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white">{title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button onClick={onConfirm} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">
                        Confirm
                    </button>
                    <button onClick={onClose} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main History Page Component ---
export default function History() {
    const { archives, filters, flash } = usePage().props;
    const isInitialMount = useRef(true);
    
    const [filter, setFilter] = useState({
        search: filters.search || '',
        status: filters.status || 'All',
    });
    const [debouncedFilter] = useDebounce(filter, 300);

    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState(null);

    const startTour = () => {
        // ... tour logic remains the same ...
    };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        router.get(route('admin.history'), debouncedFilter, {
            preserveState: true,
            replace: true,
        });
    }, [debouncedFilter]);

    const handleRestoreClick = (archive) => {
        setSelectedArchive(archive);
        setShowRestoreModal(true);
    };

    const confirmRestore = () => {
        if (!selectedArchive) return;
        router.post(route('admin.history.restore', selectedArchive.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowRestoreModal(false);
                setSelectedArchive(null);
            },
            onError: () => {
                 toast.error("Failed to restore the request.");
            }
        });
    };
    
    return (
        <AuthenticatedLayout>
            <Head title="Archive History" />
            <Toaster position="bottom-right" />
            <div className="py-12 bg-slate-50 dark:bg-gray-900/95 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-xl">
                        {/* Header Section */}
                        <div id="history-header" className="p-6 border-b border-gray-200 dark:border-gray-700">
                           {/* ... Header content ... */}
                        </div>

                        {/* Filter Tabs */}
                        <div id="history-status-filter" className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Claimed', 'Rejected'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setFilter({ ...filter, status })}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter.status === status ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div id="history-list-container">
                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {archives.data.length > 0 ? archives.data.map(archive => (
                                    <div key={archive.id} className="border-b dark:border-gray-700 p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-gray-900 dark:text-white">{archive.user?.full_name || 'N/A'}</div>
                                            <StatusBadge status={archive.status} />
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            {/* ... card details ... */}
                                        </div>
                                        {/* Restore Button for Mobile */}
                                        {archive.status === 'Rejected' && (
                                            <div className="pt-3 border-t dark:border-gray-600">
                                                <button 
                                                    onClick={() => handleRestoreClick(archive)}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                                                >
                                                    <RotateCcw size={16} />
                                                    Restore Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-16">
                                        <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Archived Records Found</h3>
                                    </div>
                                )}
                            </div>
                            
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-blue-600 text-white">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Requestor</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Document</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Final Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Remarks</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Date Archived</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold dark:text-gray-300 uppercase">Processed By</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-semibold dark:text-gray-300 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {archives.data.length > 0 ? archives.data.map(archive => (
                                            <tr key={archive.id} className="odd:bg-white even:bg-slate-100 hover:bg-sky-100 dark:odd:bg-gray-800 dark:even:bg-gray-900/50 dark:hover:bg-sky-900/20">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{archive.user?.full_name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.document_type?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={archive.status} /></td>
                                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300 max-w-xs italic">{archive.admin_remarks || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(archive.original_created_at || archive.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.processor?.full_name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {archive.status === 'Rejected' && (
                                                        <button 
                                                            onClick={() => handleRestoreClick(archive)}
                                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                                                            title="Restore this request"
                                                        >
                                                            <RotateCcw size={14} />
                                                            Restore
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-16">
                                                    <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Archived Records Found</h3>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        <div id="history-pagination" className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 gap-4">
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Showing <span className="font-medium">{archives.from || 0}</span> to <span className="font-medium">{archives.to || 0}</span> of <span className="font-medium">{archives.total || 0}</span> results
                            </p>
                            {archives.links && archives.links.length > 0 && (
                                <nav className="flex items-center gap-1 flex-wrap justify-center">
                                    {archives.links.map((link, index) => {
                                        const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                preserveScroll
                                                className={clsx(
                                                    'px-3 py-2 text-sm rounded-md leading-4 transition-colors duration-200',
                                                    !link.url ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-gray-700',
                                                    link.active ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white dark:bg-gray-800'
                                                )}
                                            >
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showRestoreModal}
                onClose={() => setShowRestoreModal(false)}
                onConfirm={confirmRestore}
                title="Restore Request?"
                message={`Are you sure you want to restore this request for ${selectedArchive?.user?.full_name}? It will be moved back to the active requests list with a 'Processing' status.`}
            />
        </AuthenticatedLayout>
    );
}
