// resources/js/Pages/Admin/History.jsx

import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import Pagination from "@/Components/Pagination"; // Gamitin natin ang Pagination component mo

// --- ICONS (Maaari mong ilipat sa isang shared file) ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const EmptyStateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16l-4-4m0 0l4-4m-4 4h18" /></svg>;

const StatusBadge = ({ status }) => {
    const colors = {
        'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        'Claimed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-x-1.5 ${colors[status] || 'bg-gray-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors[status]?.replace(/text-(green|red)-[0-9]{2,3}/, 'bg-$1-500').split(' ')[1]}`}></span>
            {status}
        </span>
    );
};

export default function History() {
    const { archives } = usePage().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const filteredArchives = useMemo(() => {
        return archives.data.filter(archive => {
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${archive.user?.profile?.first_name || ''} ${archive.user?.profile?.last_name || ''}`.toLowerCase();
            const docName = (archive.document_type?.name || '').toLowerCase();

            const matchesSearch = fullName.includes(searchLower) || docName.includes(searchLower);
            const matchesStatus = filterStatus === 'All' || archive.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [archives.data, searchTerm, filterStatus]);
    
    return (
        <AuthenticatedLayout>
            <Head title="Archive History" />

            <div className="py-12 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-2xl sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Archived Requests</h1>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">History of all claimed and rejected document requests.</p>
                                </div>
                                <div className="relative mt-4 md:mt-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                                    <input 
                                        type="text"
                                        placeholder="Search by name or document..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="block w-full md:w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                             <div className="flex space-x-2">
                                {['All', 'Claimed', 'Rejected'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterStatus === status ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Document</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Final Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date Archived</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Processed By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredArchives.length > 0 ? filteredArchives.map(archive => (
                                        <tr key={archive.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{`${archive.user?.profile?.first_name} ${archive.user?.profile?.last_name}`}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.document_type?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={archive.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(archive.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{archive.processor?.full_name || 'N/A'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-16">
                                                <EmptyStateIcon />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Archived Records Found</h3>
                                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Gamitin ang data mula sa Laravel Paginator para sa Pagination component */}
                        <Pagination 
                            links={archives.links} 
                            from={archives.from} 
                            to={archives.to} 
                            total={archives.total} 
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}