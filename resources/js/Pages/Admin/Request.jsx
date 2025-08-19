import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';

// --- DRIVER.JS IMPORTS PARA SA TUTORIAL ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- ICONS ---
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const EmptyStateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>;
const PesoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 1 0 0 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
// --- NEW ---
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H5zm0 2h10v12H5V4zm2 2a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;


// --- Reusable Components ---
const Modal = ({ children, show, onClose, title, maxWidth = '4xl' }) => {
    useEffect(() => {
        const handleEsc = (event) => { if (event.keyCode === 27) onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!show) return null;
    const maxWidthClass = { '4xl': 'max-w-4xl', 'md': 'max-w-md' }[maxWidth];
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${maxWidthClass}`} onClick={e => e.stopPropagation()}>
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
        'For Payment': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        'Processing': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        'Ready to Pickup': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        'Claimed': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-x-1.5 ${colors[status] || 'bg-gray-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors[status]?.replace(/text-(yellow|sky|blue|green|red|orange)-[0-9]{2,3}/, 'bg-$1-500').split(' ')[1]}`}></span>
            {status}
        </span>
    );
};

// --- Main Page Component ---
export default function Request() {
    const { flash, documentRequests, filters } = usePage().props;
    
    // --- NEW ---
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const isInitialMount = useRef(true);

    const [filter, setFilter] = useState({
        search: filters.search || '',
        status: filters.status || 'All',
    });
    const [debouncedFilter] = useDebounce(filter, 300);

    const { data, setData, patch, processing, errors, reset } = useForm({
        status: '',
        admin_remarks: '',
        payment_amount: '',
    });

    const filterStatusOptions = ['All', 'Pending', 'For Payment', 'Processing', 'Ready to Pickup'];
    const actionStatusOptions = ['Pending', 'Processing', 'For Payment', 'Ready to Pickup', 'Claimed', 'Rejected'];

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#header-section', popover: { title: 'Manage Requests', description: 'This is the main header. You can find the title and the search bar here.' } },
                { element: '#search-input', popover: { title: 'Search', description: 'Quickly find a specific request by typing the resident\'s name or the document type.' } },
                { element: '#status-filter-tabs', popover: { title: 'Filter by Status', description: 'Click these buttons to filter the list and see only the requests with that status.' } },
                { element: '#requests-list-container', popover: { title: 'Requests List', description: 'This area shows all the active requests. On mobile, it appears as cards, and on desktop, as a table.' } },
                { element: '#actions_item', popover: { title: 'Actions', description: 'Use this dropdown to change the status of a request. Selecting "Claimed" or "Rejected" will archive the request.' } },
                { element: '#pagination-section', popover: { title: 'Pagination', description: 'Use these controls to navigate between different pages of requests.' } }
            ]
        });
        driverObj.drive();
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
        router.get(route('admin.request'), debouncedFilter, {
            preserveState: true,
            replace: true,
        });
    }, [debouncedFilter]);

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setData({
            status: 'Rejected',
            admin_remarks: ''
        });
        setShowRejectModal(true);
    };

    const handleStatusChange = (request, newStatus) => {
        if (newStatus === 'Rejected') {
            openRejectModal(request);
            return;
        }
        router.patch(route('admin.requests.status.update', request.id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Request status updated to "${newStatus}".`),
            onError: () => toast.error('Failed to update status.')
        });
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.requests.status.update', selectedRequest.id), {
            onSuccess: () => {
                setShowRejectModal(false);
            },
            preserveScroll: true,
        });
    };
    
    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        router.post(route('admin.requests.set-payment', selectedRequest.id), {
            payment_amount: data.payment_amount,
        }, {
            onSuccess: () => {
                setShowPaymentModal(false);
                toast.success('Payment amount set successfully!');
            },
            onError: (errs) => {
                if (errs.payment_amount) {
                    toast.error(errs.payment_amount);
                } else {
                    toast.error('Failed to set payment amount.');
                }
            },
            preserveScroll: true,
        });
    };

    const handlePreviewClick = async (request) => {
        setSelectedRequest(request);
        setShowPreviewModal(true);
        setIsPreviewLoading(true);
        try {
            const response = await axios.get(route('admin.requests.preview', request.id));
            setPreviewContent(response.data.html);
        } catch (error) {
            toast.error('Could not load preview.');
            setPreviewContent('<p class="text-red-500">Error loading document preview.</p>');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const renderActions = (request, index) => {
        const isBusinessPermit = request.document_type?.name === 'Brgy Business Permit';
        
        if (isBusinessPermit && request.status === 'Pending') {
            return (
                <button
                    onClick={() => {
                        setSelectedRequest(request);
                        reset('payment_amount');
                        setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-x-2 w-full justify-center md:w-auto px-3 py-1 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                >
                    <PesoIcon />
                    Assess Payment
                </button>
            );
        }
        
        return (
            <select
                id={index === 0 ? "actions_item" : undefined}
                value={request.status}
                onChange={(e) => handleStatusChange(request, e.target.value)}
                className="w-full text-xs border-gray-300 rounded-md py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value={request.status} disabled>{request.status}</option>
                {actionStatusOptions.filter(status => status !== request.status).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Document Requests" />
            <Toaster position="bottom-right" />
            <style>{`.driverjs-theme { background-color: #fff; color: #333; }`}</style>

            <div className="py-6 md:py-12 bg-slate-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div id="header-section" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Active Requests</h1>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View and process all ongoing document requests.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                                        <input
                                            id="search-input"
                                            type="text"
                                            placeholder="Search name or document..."
                                            value={filter.search}
                                            onChange={e => setFilter({ ...filter, search: e.target.value })}
                                            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

                        <div id="status-filter-tabs" className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-2">
                                {filterStatusOptions.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter({ ...filter, status })}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter.status === status ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div id="requests-list-container">
                            <div className="md:hidden">
                                {(documentRequests.data && documentRequests.data.length > 0) ? documentRequests.data.map((request, index) => (
                                    <div key={request.id} className="border-b dark:border-gray-700 p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-gray-900 dark:text-white">{request.user?.full_name || "N/A"}</div>
                                            <StatusBadge status={request.status} />
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <p><span className="font-semibold">Document:</span> {request.document_type?.name || "N/A"}</p>
                                            <p><span className="font-semibold">Date:</span> {new Date(request.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 pt-2 border-t dark:border-gray-600 ${index === 0 ? 'actions-column-item' : ''}`}>
                                            <div className="w-full">
                                                {renderActions(request, index)}
                                            </div>
                                            {/* --- NEW: View Receipt button for mobile --- */}
                                            {request.payment_receipt_url && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowReceiptModal(true);
                                                    }}
                                                    title="View Payment Receipt"
                                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-gray-700 rounded-md transition shrink-0"
                                                >
                                                    <ReceiptIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-16">
                                        <EmptyStateIcon />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active requests found</h3>
                                    </div>
                                )}
                            </div>
                            
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-blue-600 text-white">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold hover:bg-blue-800 dark:text-gray-300 uppercase">Requestor</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold hover:bg-blue-800 dark:text-gray-300 uppercase">Document</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold hover:bg-blue-800 dark:text-gray-300 uppercase">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold hover:bg-blue-800 dark:text-gray-300 uppercase">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold hover:bg-blue-800 dark:text-gray-300 uppercase actions-column">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {(documentRequests.data && documentRequests.data.length > 0) ? documentRequests.data.map((request, index) => (
                                            <tr key={request.id} className="odd:bg-white even:bg-slate-100 hover:bg-sky-100">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.user?.full_name || "N/A"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{request.document_type?.name || "N/A"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={request.status} /></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(request.created_at).toLocaleDateString()}</td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${index === 0 ? 'actions-column-item' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        {renderActions(request, index)}

                                                        {/* --- NEW: View Receipt button for desktop --- */}
                                                        {request.payment_receipt_url && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setShowReceiptModal(true);
                                                                }}
                                                                title="View Payment Receipt"
                                                                className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-gray-700 rounded-md transition"
                                                            >
                                                                <ReceiptIcon />
                                                            </button>
                                                        )}

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
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active requests found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div id="pagination-section">
                            <Pagination
                                links={documentRequests.links}
                                from={documentRequests.from}
                                to={documentRequests.to}
                                total={documentRequests.total}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Document Request" maxWidth="md">
                <form onSubmit={handleRejectSubmit}>
                    <div className="mb-4">
                        <label htmlFor="admin_remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Rejection</label>
                        <textarea id="admin_remarks" value={data.admin_remarks} onChange={(e) => setData({ ...data, admin_remarks: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600" rows="4" required></textarea>
                        {errors.admin_remarks && <p className="text-red-500 text-xs mt-1">{errors.admin_remarks}</p>}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">Confirm Rejection</button>
                    </div>
                </form>
            </Modal>
            
            <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Set Payment Amount" maxWidth="md">
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Request Details</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Requestor:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{selectedRequest?.user?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Business Name:</span>
                            <span className="font-medium text-gray-900 dark:text-white text-right">{selectedRequest?.form_data?.business_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Business Type:</span>
                            <span className="font-medium text-gray-900 dark:text-white text-right">{selectedRequest?.form_data?.business_type || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-gray-500 dark:text-gray-400">Business Address:</span>
                            <span className="font-medium text-gray-900 dark:text-white mt-1 text-right">{selectedRequest?.form_data?.business_address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-4">
                        <label htmlFor="payment_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Enter Assessed Amount (PHP)
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">₱</span>
                            </div>
                            <input
                                id="payment_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.payment_amount}
                                onChange={(e) => setData('payment_amount', e.target.value)}
                                className="block w-full rounded-md border-gray-300 pl-7 pr-3 py-2 shadow-sm dark:bg-gray-900 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                        {errors.payment_amount && <p className="text-red-500 text-xs mt-1">{errors.payment_amount}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Set Amount & Notify User'}
                        </button>
                    </div>
                </form>
            </Modal>
            
            {/* --- NEW RECEIPT MODAL --- */}
            <Modal show={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Receipt" maxWidth="md">
                {selectedRequest?.payment_receipt_url ? (
                    <div>
                        <img 
                            src={selectedRequest.payment_receipt_url} 
                            alt="Payment Receipt" 
                            className="w-full h-auto rounded-lg border dark:border-gray-600"
                        />
                         <div className="text-center mt-4">
                            <a 
                                href={selectedRequest.payment_receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Open image in new tab
                            </a>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">Receipt image could not be loaded or is not available.</p>
                )}
            </Modal>
            
            <Modal show={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={`Preview: ${selectedRequest?.document_type?.name || ''}`}>
                <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 rounded-lg max-h-[75vh] overflow-y-auto">
                    {isPreviewLoading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
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