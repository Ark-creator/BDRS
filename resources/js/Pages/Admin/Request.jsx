import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, useForm, router } from "@inertiajs/react";
import axios from 'axios'; // Siguraduhing naka-import ang axios

// --- Modal Component ---
const Modal = ({ children, show, onClose, title }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">&times;</button>
                </div>
                {/* Ginawang scrollable ang content ng modal */}
                <div className="mt-4 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export default function Request() {
    const { documentRequests } = usePage().props;
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const { data, setData, patch, processing, errors, reset } = useForm({
        admin_remarks: '',
    });

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        reset();
        setShowRejectModal(true);
    };

    const handleManualStatusChange = (request, newStatus) => {
        if (newStatus === 'Rejected') {
            openRejectModal(request);
            return;
        }
        if (confirm(`Are you sure you want to update the status to "${newStatus}"?`)) {
            router.patch(route('admin.requests.status.update', request.id), { status: newStatus }, { preserveScroll: true });
        }
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        patch(route('admin.requests.status.update', selectedRequest.id), {
            data: { status: 'Rejected', admin_remarks: data.admin_remarks },
            onSuccess: () => { setShowRejectModal(false); reset(); },
            preserveScroll: true,
        });
    };

    // --- FUNCTION PARA SA PREVIEW ---
    const handlePreviewClick = async (request) => {
        setSelectedRequest(request);
        setShowPreviewModal(true);
        setIsPreviewLoading(true);
        setPreviewContent('');

        try {
            const response = await axios.get(route('admin.requests.preview', request.id));
            setPreviewContent(response.data.html);
        } catch (error) {
            console.error("Error fetching document preview:", error);
            setPreviewContent('<p class="text-center text-red-500">Could not load preview. Check the template file and controller logic.</p>');
        } finally {
            setIsPreviewLoading(false);
        }
    };
    
    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'border-yellow-400 text-yellow-800 bg-yellow-100',
            'Processing': 'border-blue-400 text-blue-800 bg-blue-100',
            'Ready for Pickup': 'border-green-400 text-green-800 bg-green-100',
            'Claimed': 'border-gray-400 text-gray-800 bg-gray-100',
            'Rejected': 'border-red-400 text-red-800 bg-red-100',
        };
        return colors[status] || 'border-gray-300 bg-gray-200 text-gray-600';
    };

    const statusOptions = ['Pending', 'Processing', 'Ready for Pickup', 'Claimed', 'Rejected'];

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Requests</h2>}>
            <Head title="Requests" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="font-semibold text-xl mb-4">Document Requests</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {documentRequests.length > 0 ? documentRequests.map((request) => (
                                            <tr key={request.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{request.user?.profile ? `${request.user.profile.first_name} ${request.user.profile.last_name}` : "N/A"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{request.document_type?.name || "N/A"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select 
                                                        value={request.status}
                                                        onChange={(e) => handleManualStatusChange(request, e.target.value)}
                                                        className={`text-xs font-semibold rounded-full border-2 p-1.5 focus:ring-indigo-500 focus:border-indigo-500 ${getStatusColor(request.status)}`}
                                                    >
                                                        {statusOptions.map(status => (<option key={status} value={status}>{status}</option>))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(request.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                                    {request.status === 'Processing' && (
                                                        <>
                                                            {/* --- PREVIEW BUTTON --- */}
                                                            <button onClick={() => handlePreviewClick(request)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Preview</button>
                                                            <a href={route('admin.requests.generate', request.id)} className="text-indigo-600 hover:text-indigo-900">Generate</a>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center">No requests found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Document Request">
                <form onSubmit={handleRejectSubmit}>
                    <div className="mb-4">
                        <label htmlFor="admin_remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Rejection</label>
                        <textarea id="admin_remarks" value={data.admin_remarks} onChange={(e) => setData('admin_remarks', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600" rows="4" required></textarea>
                        {errors.admin_remarks && <p className="text-red-500 text-xs mt-1">{errors.admin_remarks}</p>}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400">Reject Request</button>
                    </div>
                </form>
            </Modal>

            {/* --- PREVIEW MODAL --- */}
            <Modal show={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={`Preview: ${selectedRequest?.document_type?.name || ''}`}>
                {isPreviewLoading ? (
                    <div className="text-center p-8">Loading preview...</div>
                ) : (
                    <div 
                        className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900 prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
