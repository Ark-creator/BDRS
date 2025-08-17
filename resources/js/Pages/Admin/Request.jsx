import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, router, Link } from '@inertiajs/react';
import axios from 'axios';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Toaster, toast } from 'react-hot-toast';

// --- ICONS ---
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const EmptyStateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>;
const TourIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L7 9.167A1 1 0 007 10.833L9.133 13.5a1 1 0 001.734 0L13 10.833A1 1 0 0013 9.167L10.867 6.5A1 1 0 0010 7z" clipRule="evenodd" /></svg>;

// --- Reusable Components ---
const Modal = ({ children, show, onClose, title, maxWidth = '4xl' }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!show) return null;
    const maxWidthClass = { '4xl': 'max-w-4xl', 'md': 'max-w-md' }[maxWidth];
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${maxWidthClass} transform transition-all duration-300 ease-in-out`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 leading-none text-2xl">&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const colors = {
        'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
        'Processing': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        'Ready to Pickup': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        'Claimed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-x-1.5 ${colors[status] || 'bg-gray-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors[status]?.replace(/text-(yellow|sky|blue|green|red)-[0-9]{2,3}/, 'bg-$1-500').split(' ')[1]}`}></span>
            {status}
        </span>
    );
};

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
            </p>
            <nav className="flex items-center gap-2">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    &laquo; Previous
                </button>
                {pageNumbers.map(number => (
                    <button 
                        key={number} 
                        onClick={() => onPageChange(number)}
                        className={`px-3 py-1 text-sm rounded-md ${currentPage === number ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800   hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        {number}
                    </button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-800  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                     Next &raquo;
                </button>
            </nav>
        </div>
    );
};

// --- Main Page Component ---
export default function Request() {
    const { flash, documentRequests: rawRequests } = usePage().props;

    // ✅ Normalize: works whether `documentRequests` is an array or a paginator object
    const documentRequests = Array.isArray(rawRequests) ? rawRequests : (rawRequests?.data ?? []);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filter, setFilter] = useState({ search: '', status: 'All' });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { data, setData, patch, processing, errors, reset } = useForm({ admin_remarks: '' });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        reset();
        setShowRejectModal(true);
    };

    const handleStatusChange = (request, newStatus) => {
        if (newStatus === 'Rejected') {
            openRejectModal(request);
            return;
        }
        
        router.patch(route('admin.requests.status.update', request.id), { status: newStatus }, { 
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Request status updated to "${newStatus}".`);
            },
            onError: () => {
                toast.error('Failed to update status.');
            }
        });
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.requests.status.update', selectedRequest.id), {
            data: { status: 'Rejected', admin_remarks: data.admin_remarks },
            onSuccess: () => { 
                setShowRejectModal(false); 
                reset(); 
                toast.success('Request has been rejected.');
            },
            preserveScroll: true,
        });
    };
    
    const handlePreviewClick = async (request) => {
        setSelectedRequest(request);
        setShowPreviewModal(true);
        setIsPreviewLoading(true);
        setPreviewContent('');
        try {
            const response = await axios.get(route('admin.requests.preview', request.id));
            setPreviewContent(response.data.html);
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Could not load preview.';
            setPreviewContent(`<div class="p-8 text-center text-red-500">${errorMessage}</div>`);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const filteredRequests = useMemo(() => {
        return documentRequests.filter(req => {
            const searchLower = filter.search.toLowerCase();
            const fullName = `${req.user?.profile?.first_name || ''} ${req.user?.profile?.last_name || ''}`.toLowerCase();
            const docName = (req.document_type?.name || '').toLowerCase();
            const matchesSearch = fullName.includes(searchLower) || docName.includes(searchLower);
            const matchesStatus = filter.status === 'All' || req.status === filter.status;
            return matchesSearch && matchesStatus;
        });
    }, [documentRequests, filter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredRequests, currentPage]);

    const statusOptions = ['All', 'Pending', 'Processing', 'Ready to Pickup', 'Claimed', 'Rejected'];

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                { element: '#header-section', popover: { title: 'Manage Requests', description: 'This is where you manage all document requests.' } },
                { element: '#search-input', popover: { title: 'Search Requests', description: 'Quickly find a request by typing the resident\'s name or the document type.' } },
                { element: '#status-filter-tabs', popover: { title: 'Filter by Status', description: 'Click on a status to filter the list.' } },
                { element: '#requests-table', popover: { title: 'Requests List', description: 'View all the details of each request here.' } },
                { element: '.actions-column', popover: { title: 'Perform Actions', description: 'You can change the status, preview, or generate the document for processing requests.' } },
            ]
        });
        driverObj.drive();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Document Requests" />
            <Toaster position="bottom-right" />
            <style>{`
                .document-preview-container { background-color: #fff; max-width: 8.5in; min-height: 11in; margin: 1rem auto; padding: 1in; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: 'Times New Roman', serif; color: #000; }
                .document-preview-content { text-align: center; }
                .header-logo { margin-bottom: 2rem; }
                .header-logo img { max-width: 100px; margin: 0 auto; }
                .document-preview-container h1 { font-size: 24px; font-weight: bold; margin-bottom: 2rem; }
                .document-preview-container p { font-size: 14px; line-height: 1.6; text-align: justify; margin-bottom: 1.5rem; }
                .signature-area { margin-top: 5rem; text-align: center; }
            `}</style>

            <div className="py-12 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div id="header-section" className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Requests</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View and process all registered document requests.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                                <input 
                                    id="search-input"
                                    type="text"
                                    placeholder="Search..."
                                    value={filter.search}
                                    onChange={e => setFilter({...filter, search: e.target.value})}
                                    className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <button onClick={startTour} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <TourIcon />
                                Need Help?
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div id="status-filter-tabs" className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-1">
                                {statusOptions.map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setFilter({...filter, status})}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter.status === status ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {status} <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${filter.status === status ? 'bg-blue-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'}`}>{status === 'All' ? documentRequests.length : documentRequests.filter(r => r.status === status).length}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div id="requests-table" className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-sky-50 dark:bg-sky-900/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Requestor</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Document</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider actions-column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedRequests.length > 0 ? paginatedRequests.map((request, index) => (
                                        <tr key={request.id} className={`odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors duration-150`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{request.user?.profile ? `${request.user.profile.first_name} ${request.user.profile.last_name}` : "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{request.document_type?.name || "N/A"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={request.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(request.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <select 
                                                        value={request.status}
                                                        onChange={(e) => handleStatusChange(request, e.target.value)}
                                                        className="text-xs border-gray-300 rounded-md py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value={request.status} disabled>{request.status}</option>
                                                        {statusOptions.filter(s => s !== 'All' && s !== request.status).map(status => (<option key={status} value={status}>{status}</option>))}
                                                    </select>
                                                    {request.status === 'Processing' && (
                                                        <>
                                                            <button onClick={() => handlePreviewClick(request)} title="Preview" className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><EyeIcon /></button>
                                                            <a href={route('admin.requests.generate', request.id)} title="Generate" className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><DownloadIcon /></a>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-16">
                                                <EmptyStateIcon />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No requests found</h3>
                                                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalItems={filteredRequests.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
                    </div>
                </div>
            </div>

            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Document Request" maxWidth="md">
                <form onSubmit={handleRejectSubmit}>
                    <div className="mb-4">
                        <label htmlFor="admin_remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Rejection</label>
                        <textarea id="admin_remarks" value={data.admin_remarks} onChange={(e) => setData('admin_remarks', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" rows="4" required></textarea>
                        {errors.admin_remarks && <p className="text-red-500 text-xs mt-1">{errors.admin_remarks}</p>}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">Confirm Rejection</button>
                    </div>
                </form>
            </Modal>

            <Modal show={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={`Preview: ${selectedRequest?.document_type?.name || ''}`}>
                <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 rounded-lg max-h-[75vh] overflow-y-auto">
                    {isPreviewLoading ? (
                        <div className="text-center p-8 text-gray-500 flex items-center justify-center min-h-[400px]">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="document-preview-container" dangerouslySetInnerHTML={{ __html: previewContent }} />
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
