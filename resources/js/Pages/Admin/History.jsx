import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { useDebounce } from 'use-debounce';
import clsx from 'clsx';

// --- DRIVER.JS IMPORTS PARA SA TUTORIAL ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- ICONS ---
import { Search, History as HistoryIcon, User, FileText, CalendarDays, HelpCircle, FileQuestion, MessageSquare } from 'lucide-react'; // Added MessageSquare Icon

// --- Reusable Status Badge Component ---
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

// --- Main History Page Component ---
export default function History() {
    const { archives, filters } = usePage().props;
    const isInitialMount = useRef(true);
    
    const [filter, setFilter] = useState({
        search: filters.search || '',
        status: filters.status || 'All',
    });
    const [debouncedFilter] = useDebounce(filter, 300);

    // --- DRIVER.JS TOUR LOGIC ---
    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme', 
            steps: [
                { element: '#history-header', popover: { title: 'Archive History', description: 'This is the main header where you can find the page title and key actions.' } },
                { element: '#history-search-input', popover: { title: 'Search Records', description: 'Quickly find a specific record by typing the resident\'s name or the document type.' } },
                { element: '#history-status-filter', popover: { title: 'Filter by Status', description: 'Click these buttons to view all records, or only those that were "Claimed" or "Rejected".' } },
                { element: '#history-list-container', popover: { title: 'Archived Records', description: 'This area shows all the completed requests.' } },
                { element: '#history-pagination', popover: { title: 'Pagination', description: 'Use these controls to navigate between different pages of archived records.' } }
            ]
        });
        driverObj.drive();
    };

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
    
    return (
        <AuthenticatedLayout>
            <Head title="Archive History" />
            <div className="py-12 bg-slate-50 dark:bg-gray-900/95 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-xl">
                        {/* Header Section */}
                        <div id="history-header" className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Archived Requests</h1>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">History of all claimed and rejected requests.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                                        <input 
                                            id="history-search-input"
                                            type="text"
                                            placeholder="Search records..."
                                            value={filter.search}
                                            onChange={e => setFilter({ ...filter, search: e.target.value })}
                                            className="block w-full md:w-64 pl-10 pr-3 py-2 border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={startTour}
                                        className="flex items-center gap-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        aria-label="Start tour"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L7 9.167A1 1 0 007 10.833L9.133 13.5a1 1 0 001.734 0L13 10.833A1 1 0 0013 9.167L10.867 6.5A1 1 0 0010 7z" clipRule="evenodd" />
                                        </svg>
                                        <span className="hidden sm:inline text-xs">Need Help?</span>
                                    </button>
                                </div>
                            </div>
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
                                            <p className="flex items-center gap-2"><FileText size={14} /><span>{archive.document_type?.name}</span></p>
                                            <p className="flex items-center gap-2"><CalendarDays size={14} /><span>{new Date(archive.created_at).toLocaleDateString()}</span></p>
                                            <p className="flex items-center gap-2"><User size={14} /><span>{archive.processor?.full_name || 'N/A'}</span></p>
                                            {/* --- NEW: Display Admin Remarks in Mobile View --- */}
                                            {archive.admin_remarks && (
                                                <p className="flex items-start gap-2 pt-1 text-gray-500">
                                                    <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                                                    <span className="italic">"{archive.admin_remarks}"</span>
                                                </p>
                                            )}
                                        </div>
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
                                    <thead className="bg-blue-600 text-white border-b border-blue-200">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Requestor</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Document</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Final Status</th>
                                            {/* --- NEW: Remarks Column Header --- */}
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Remarks</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Date Archived</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold  hover:bg-blue-800 dark:text-gray-300 uppercase">Processed By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {archives.data.length > 0 ? archives.data.map(archive => (
                                            <tr key={archive.id} className="odd:bg-white even:bg-slate-100 hover:bg-sky-100">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{archive.user?.full_name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.document_type?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={archive.status} /></td>
                                                {/* --- NEW: Display Admin Remarks in Table Cell --- */}
                                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300 max-w-xs italic">{archive.admin_remarks || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(archive.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.processor?.full_name || 'N/A'}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                {/* --- MODIFIED: Updated colSpan to 6 --- */}
                                                <td colSpan="6" className="text-center py-16">
                                                    <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Archived Records Found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* IN-FILE PAGINATION LOGIC */}
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
        </AuthenticatedLayout>
    );
}