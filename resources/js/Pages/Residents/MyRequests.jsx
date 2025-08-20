import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';

// --- Reusable Components (Modal and StatusBadge) ---
const Modal = ({ children, show, onClose, title }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
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
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-200'}`}>
            {status}
        </span>
    );
};

// --- Main Page Component ---
export default function MyRequests({ requests }) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const { data, setData, post, processing, errors, reset, progress } = useForm({
        receipt: null,
    });

    const openPaymentModal = (request) => {
        setSelectedRequest(request);
        reset();
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        if (!data.receipt) {
            alert('Please select a receipt file to upload.');
            return;
        }
        post(route('residents.requests.submit-payment', selectedRequest.id), {
            onSuccess: () => setShowPaymentModal(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Document Requests" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold">My Document Requests</h2>
                            <p className="text-gray-500 mt-1">Track the status of all your submitted documents here.</p>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {requests.data.length > 0 ? (
                                requests.data.map(request => (
                                    <div key={request.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400">{request.document_type.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Requested on: {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                                            <StatusBadge status={request.status} />

                                            {request.document_type.name === 'Brgy Business Permit' && request.status === 'Waiting for Payment' && (
                                                <div className="mt-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-center w-full border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">Amount to Pay:</p>
                                                    <p className="font-bold text-2xl text-blue-800 dark:text-blue-300">
                                                        ₱{parseFloat(request.payment_amount).toFixed(2)}
                                                    </p>
                                                    <button 
                                                        onClick={() => openPaymentModal(request)}
                                                        className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                                                    >
                                                        Upload Receipt
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    You have not made any requests yet.
                                </div>
                            )}
                        </div>
                        
                        {requests.data.length > 0 && (
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                <Pagination links={requests.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Submit Proof of Payment">
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Payment Instructions</h4>
                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                        <li>Scan the QR code below to pay the exact amount.</li>
                        <li>Take a screenshot of the successful transaction receipt.</li>
                        <li>Upload the screenshot in the form below.</li>
                    </ol>
                    <div className="text-sm space-y-3">
                        <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-200">GCash Payment</p>
                            
                            {/* --- NEW QR CODE SECTION --- */}
                            <div className="text-center my-2">
                                <img 
                                    src="/images/gcash_qr_code.png" 
                                    alt="GCash QR Code"
                                    className="w-40 h-40 mx-auto rounded-lg border p-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Scan to Pay</p>
                            </div>
                            {/* --- END NEW SECTION --- */}
                            
                            <p className="text-gray-600 dark:text-gray-300">Account Name: B. San Isidro Treasury</p>
                            <p className="text-gray-600 dark:text-gray-300">Account Number: 0912-345-6789</p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-4">
                        <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload Receipt Screenshot
                        </label>
                        <input
                            id="receipt"
                            type="file"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300 dark:hover:file:bg-blue-900/60"
                            onChange={(e) => setData('receipt', e.target.files[0])}
                            accept="image/png, image/jpeg"
                            required
                        />
                        {progress && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                            </div>
                        )}
                        {errors.receipt && <p className="text-red-500 text-xs mt-2">{errors.receipt}</p>}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700 mt-6">
                        <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {processing ? 'Uploading...' : 'Submit Payment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}