import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h3 className="text-2xl font-bold text-gray-800">Review User Credentials</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value }) => (
    <div className="mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg text-gray-800">{value || 'N/A'}</p>
    </div>
);

const ImageBox = ({ title, path }) => {
    // Note: In a real app, you'd get the base URL from config.
    // For local dev, this assumes your storage is linked and accessible at /storage/
    const imageUrl = path ? `/storage/${path}` : 'https://placehold.co/600x400/e2e8f0/e2e8f0?text=No+Image';

    return (
        <div className="w-full md:w-1/3 p-2">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 h-full">
                <h4 className="text-md font-semibold text-gray-700 mb-3 text-center">{title}</h4>
                <div className="aspect-w-3 aspect-h-2 rounded-md overflow-hidden">
                     <img
                        src={imageUrl}
                        alt={title}
                        className="object-contain w-full h-full"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/e2e8f0/e2e8f0?text=Error'; }}
                    />
                </div>
            </div>
        </div>
    );
};


export default function VerificationModal({ user, isOpen, onClose, onVerify, onReject, isUpdating }) {
    if (!user) return null;

    const handleVerify = () => {
        onVerify(user, 'verified');
    };

    const handleReject = () => {
        onReject(user, 'rejected');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">User Information</h3>
                    <InfoField label="Full Name" value={user.full_name} />
                    <InfoField label="Email" value={user.email} />
                    <InfoField label="Phone Number" value={user.profile?.phone_number} />
                    <InfoField label="Address" value={user.profile?.address} />
                    <InfoField label="Birthday" value={user.profile?.birthday ? new Date(user.profile.birthday).toLocaleDateString() : 'N/A'} />
                </div>
                 <div>
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Account Status</h3>
                    <InfoField label="Current Role" value={user.role} />
                    <InfoField label="Registered On" value={new Date(user.created_at).toLocaleString()} />
                    <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm font-medium text-blue-600">Current Verification Status</p>
                        <p className="text-2xl font-bold text-blue-800 capitalize">{user.verification_status.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6">Uploaded Credentials</h3>
                <div className="flex flex-wrap -m-2">
                    <ImageBox title="Valid ID (Front)" path={user.profile?.valid_id_front_path} />
                    <ImageBox title="Valid ID (Back)" path={user.profile?.valid_id_back_path} />
                    <ImageBox title="Selfie with ID" path={user.profile?.face_image_path} />
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
                 <button
                    onClick={handleReject}
                    disabled={isUpdating || user.verification_status === 'rejected'}
                    className="flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                </button>
                <button
                    onClick={handleVerify}
                    disabled={isUpdating || user.verification_status === 'verified'}
                    className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify Account
                </button>
            </div>
        </Modal>
    );
}
