import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import {
    Eye,
    Download,
    Search,
    FileX2,
    LoaderCircle,
    CircleDollarSign,
    ReceiptText,
    HelpCircle,
    XCircle,
    Clock,
    CreditCard,
    PackageCheck,
    CheckCircle2,
    Hourglass,
    ThumbsUp,
} from 'lucide-react';

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
            <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full ${maxWidthClass}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 leading-none text-2xl">&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Rejected': {
            badgeClasses: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            icon: <XCircle className="h-4 w-4" />
        },
        'Claimed': {
            badgeClasses: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            icon: <CheckCircle2 className="h-4 w-4" />
        },
        'Processing': {
            badgeClasses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            icon: <LoaderCircle className="h-4 w-4 animate-spin" />
        },
        'Pending': {
            badgeClasses: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            icon: <Clock className="h-4 w-4" />
        },
        'Waiting for Payment': {
            badgeClasses: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
            icon: <Hourglass className="h-4 w-4" />
        },
        'Ready to Pickup': {
            badgeClasses: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300',
            icon: <ThumbsUp className="h-4 w-4" />
        },
        'Place an Amount to Pay': {
            badgeClasses: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
            icon: <CircleDollarSign className="h-4 w-4" />
        },
        'default': {
           badgeClasses: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
            icon: <HelpCircle className="h-4 w-4" />
        }
    };
    const currentConfig = statusConfig[status] || statusConfig['default'];

    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-x-2 ${currentConfig.badgeClasses}`}>
            {currentConfig.icon}
            <span>{status || 'Unknown'}</span>
        </span>
    );
};

// --- Main Page Component ---
export default function Request() {
    const { flash, documentRequests, filters } = usePage().props;
    
    const [displayedRequests, setDisplayedRequests] = useState(documentRequests);
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
    
    const filterStatusOptions = ['All', 'Pending', 'Waiting for Payment', 'Processing', 'Ready to Pickup'];
    const actionStatusOptions = ['Processing', 'Ready to Pickup', 'Claimed', 'Rejected'];

    // --- FIX: Add this useEffect to sync local state with props ---
    // This ensures that when Inertia updates the documentRequests prop (after a filter or status change),
    // our local state `displayedRequests` is also updated, forcing the component to re-render.
    useEffect(() => {
        setDisplayedRequests(documentRequests);
    }, [documentRequests]); // This effect runs whenever the `documentRequests` prop changes.

    // --- REAL-TIME LISTENER ---
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.private('admin-requests');

            channel.listen('.NewDocumentRequest', (event) => {
                toast.success(`New request from ${event.request.user.full_name}!`, {
                    position: "bottom-right",
                });

                setDisplayedRequests(currentRequests => {
                    const newRequestData = [event.request, ...currentRequests.data];
                    const uniqueRequests = Array.from(new Map(newRequestData.map(item => [item.id, item])).values());

                    return {
                        ...currentRequests,
                        data: uniqueRequests,
                        total: currentRequests.total + 1,
                    };
                });
            });

            return () => {
                channel.stopListening('.NewDocumentRequest');
                window.Echo.leave('admin-requests');
            };
        }
    }, []);

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme',
            steps: [
                { element: '#header-section', popover: { title: 'Manage Requests', description: 'This is the main header.' } },
                { element: '#search-input', popover: { title: 'Search', description: 'Find a request by name or document type.' } },
                { element: '#status-filter-tabs', popover: { title: 'Filter by Status', description: 'Filter requests by their current status.' } },
                { element: '#requests-list-container', popover: { title: 'Requests List', description: 'This area shows all active requests.' } },
                { element: '#actions-item', popover: { title: 'Actions', description: 'Change the status of a request here.' } },
                { element: '#pagination-section', popover: { title: 'Pagination', description: 'Navigate between pages of requests.' } }
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
        setData({ status: 'Rejected', admin_remarks: '' });
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
            onSuccess: () => { setShowRejectModal(false); },
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
                toast.error(errs.payment_amount || 'Failed to set payment amount.');
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
        
        if (isBusinessPermit && (request.status === 'Pending' || request.status === 'Place an Amount to Pay')) {
            return (
                <button
                    onClick={() => {
                        setSelectedRequest(request);
                        reset('payment_amount');
                        setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-x-1.5 w-full justify-center md:w-auto px-3 py-1.5 text-xs font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
                >
                    <CircleDollarSign className="w-4 h-4" />
                    Place Amount
                </button>
            );
        }
        if (isBusinessPermit && request.status === 'Waiting for Payment') {
            return <div className="text-xs text-slate-500 font-bold">Waiting for payment</div>;
        }

        return (
            <select
                id={index === 0 ? "actions-item" : undefined}
                value={request.status}
                onChange={(e) => handleStatusChange(request, e.target.value)}
                className="w-full text-xs border-slate-300 rounded-md py-1.5 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
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

            <div className="py-6 md:py-12 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 px-4">
                    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-md sm:rounded-lg">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div id="header-section" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Manage Active Requests</h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">View and process all ongoing document requests.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="search-input"
                                            type="text"
                                            placeholder="Search name or document..."
                                            value={filter.search}
                                            onChange={e => setFilter({ ...filter, search: e.target.value })}
                                            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button onClick={startTour} className="flex items-center gap-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Start tour">
                                        <HelpCircle className="h-5 w-5" />
                                        <span className="hidden sm:inline text-xs">Need Help?</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div id="status-filter-tabs" className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2">
                                {filterStatusOptions.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter({ ...filter, status })}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter.status === status ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div id="requests-list-container">
                            {/* MOBILE VIEW */}
                            <div className="md:hidden">
                                {(displayedRequests.data && displayedRequests.data.length > 0) ? displayedRequests.data.map((request, index) => (
                                    <div key={request.id} className="border-b dark:border-slate-700 p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                                    {request.user?.full_name.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{request.user?.full_name || "N/A"}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{request.user?.email || "N/A"}</div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <StatusBadge status={request.status} />
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 pl-13 space-y-1">
                                            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Document:</span> {request.document_type?.name || "N/A"}</p>
                                            <p><span className="font-semibold text-slate-700 dark:text-slate-300">Date:</span> {new Date(request.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 pt-3 border-t dark:border-slate-600 ${index === 0 ? 'actions-column-item' : ''}`}>
                                            <div className="flex-grow">
                                                {renderActions(request, index)}
                                            </div>
                                            <div className="flex items-center shrink-0">
                                                {request.payment_receipt_url && (
                                                    <button onClick={() => { setSelectedRequest(request); setShowReceiptModal(true); }} title="View Payment Receipt" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><ReceiptText className="w-5 h-5" /></button>
                                                )}
                                                {request.status === 'Processing' && (
                                                    <>
                                                        <button onClick={() => handlePreviewClick(request)} title="Preview" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><Eye className="w-5 h-5" /></button>
                                                        <a href={route('admin.requests.generate', request.id)} title="Generate" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><Download className="w-5 h-5" /></a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-16">
                                        <FileX2 className="mx-auto h-12 w-12 text-slate-400" />
                                        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No active requests found</h3>
                                    </div>
                                )}
                            </div>
                            
                            {/* DESKTOP VIEW */}
                            <div className="hidden md:block">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Requestor</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Document</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider actions-column">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        {(displayedRequests.data && displayedRequests.data.length > 0) ? displayedRequests.data.map((request, index) => (
                                            <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                                            {request.user?.full_name.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">{request.user?.full_name || "N/A"}</div>
                                                            <div className="text-slate-500 dark:text-slate-400 text-xs">{request.user?.email || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{request.document_type?.name || "N/A"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={request.status} /></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${index === 0 ? 'actions-column-item' : ''}`}>
                                                    <div className="flex items-center gap-2" id={index === 0 ? "actions-item" : undefined}>
                                                        <div className="w-40">
                                                            {renderActions(request, index)}
                                                        </div>
                                                        <div className="flex items-center">
                                                            {request.payment_receipt_url && (
                                                                <button onClick={() => { setSelectedRequest(request); setShowReceiptModal(true); }} title="View Payment Receipt" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><ReceiptText className="w-5 h-5" /></button>
                                                            )}
                                                            {request.status === 'Processing' && (
                                                                <>
                                                                    <button onClick={() => handlePreviewClick(request)} title="Preview" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><Eye className="w-5 h-5" /></button>
                                                                    <a href={route('admin.requests.generate', request.id)} title="Generate" className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition"><Download className="w-5 h-5" /></a>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-16">
                                                    <FileX2 className="mx-auto h-12 w-12 text-slate-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No active requests found</h3>
                                                    <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {displayedRequests.data.length > 0 && (
                             <div id="pagination-section">
                                <Pagination
                                    links={displayedRequests.links}
                                    from={displayedRequests.from}
                                    to={displayedRequests.to}
                                    total={displayedRequests.total}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Document Request" maxWidth="md">
                <form onSubmit={handleRejectSubmit}>
                    <div className="mb-4">
                        <label htmlFor="admin_remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Rejection</label>
                        <textarea id="admin_remarks" value={data.admin_remarks} onChange={(e) => setData({ ...data, admin_remarks: e.target.value })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm dark:bg-slate-900 dark:border-slate-600" rows="4" required></textarea>
                        {errors.admin_remarks && <p className="text-red-500 text-xs mt-1">{errors.admin_remarks}</p>}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">Confirm Rejection</button>
                    </div>
                </form>
            </Modal>
            
            <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Set Payment Amount" maxWidth="md">
                <div className="mb-6 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700">
                    <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-3">Request Details</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Requestor:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{selectedRequest?.user?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Business Name:</span>
                            <span className="font-medium text-slate-900 dark:text-white text-right">{selectedRequest?.form_data?.business_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Business Type:</span>
                            <span className="font-medium text-slate-900 dark:text-white text-right">{selectedRequest?.form_data?.business_type || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-slate-500 dark:text-slate-400">Business Address:</span>
                            <span className="font-medium text-slate-900 dark:text-white mt-1 text-right">{selectedRequest?.form_data?.business_address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-4">
                        <label htmlFor="payment_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Enter Assessed Amount (PHP)
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-slate-500 sm:text-sm">₱</span>
                            </div>
                            <input
                                id="payment_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.payment_amount}
                                onChange={(e) => setData('payment_amount', e.target.value)}
                                className="block w-full rounded-md border-slate-300 pl-7 pr-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                        {errors.payment_amount && <p className="text-red-500 text-xs mt-1">{errors.payment_amount}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Set Amount & Notify User'}
                        </button>
                    </div>
                </form>
            </Modal>
            
            <Modal show={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Receipt" maxWidth="md">
                {selectedRequest?.payment_receipt_url ? (
                    <div>
                        <img 
                            src={selectedRequest.payment_receipt_url} 
                            alt="Payment Receipt" 
                            className="w-full h-auto rounded-lg border dark:border-slate-600"
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
                    <p className="text-center text-slate-500">Receipt image could not be loaded or is not available.</p>
                )}
            </Modal>
            
            <Modal show={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={`Preview: ${selectedRequest?.document_type?.name || ''}`}>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 sm:p-8 rounded-lg max-h-[75vh] overflow-y-auto">
                    {isPreviewLoading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <LoaderCircle className="animate-spin h-8 w-8 text-blue-500" />
                        </div>
                    ) : (
                        <div className="document-preview-container" dangerouslySetInnerHTML={{ __html: previewContent }} />
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
