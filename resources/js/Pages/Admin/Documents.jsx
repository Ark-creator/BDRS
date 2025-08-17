import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, useForm, router } from "@inertiajs/react";
import axios from 'axios';

// --- Modal Component ---
const Modal = ({ children, show, onClose, title }) => {
    if (!show) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl transform transition-all" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </button>
                </div>
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};


// --- Main Documents Component ---
export default function Documents() {
    const { documentTypes = [] } = usePage().props;
    const [editingDocType, setEditingDocType] = useState(null);
    const [showArchivedModal, setShowArchivedModal] = useState(false);
    const [archivedDocs, setArchivedDocs] = useState([]);
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    const { data, setData, patch, processing, errors, clearErrors } = useForm({
        name: '',
        description: '',
    });

    const handleEditClick = (docType) => {
        setEditingDocType(docType.id);
        setData(docType);
        clearErrors();
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        patch(route('admin.documents.update', editingDocType), {
            onSuccess: () => setEditingDocType(null),
        });
    };

    const handleArchive = (docType) => {
        if (confirm(`Sigurado ka bang i-archive ang "${docType.name}"?`)) {
            router.patch(route('admin.documents.archive', docType.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const handleRestore = (docType) => {
        if (confirm(`Sigurado ka bang i-restore ang "${docType.name}"?`)) {
            router.patch(route('admin.documents.archive', docType.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setArchivedDocs(prevDocs => prevDocs.filter(doc => doc.id !== docType.id));
                }
            });
        }
    };

    const openArchivedModal = async () => {
        setShowArchivedModal(true);
        setIsLoadingModal(true);
        try {
            const response = await axios.get(route('admin.documents.archived.data'));
            setArchivedDocs(response.data.archivedDocuments);
        } catch (error) {
            console.error("Error sa pagkuha ng archived documents:", error);
        } finally {
            setIsLoadingModal(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Documents</h2>}
        >
            <Head title="Documents" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 leading-tight">
                                    Available Document Types
                                </h3>
                                <button 
                                    onClick={openArchivedModal}
                                    className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-500 active:bg-gray-700"
                                >
                                    View Archived
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {documentTypes.length > 0 ? (
                                            documentTypes.map((docType) => (
                                                <tr key={docType.id}>
                                                    {editingDocType === docType.id ? (
                                                        <>
                                                            <td className="px-6 py-4"><input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded" /></td>
                                                            <td className="px-6 py-4"><input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded" /></td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <button onClick={handleUpdate} disabled={processing} className="text-green-600 hover:text-green-900">Save</button>
                                                                <button onClick={() => setEditingDocType(null)} className="ml-4 text-gray-600 hover:text-gray-900">Cancel</button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-6 py-4 whitespace-nowrap">{docType.name}</td>
                                                            <td className="px-6 py-4">{docType.description}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                <button onClick={() => handleEditClick(docType)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                                <button onClick={() => handleArchive(docType)} className="ml-4 text-yellow-600 hover:text-yellow-900">Archive</button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No active document types found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Modal show={showArchivedModal} onClose={() => setShowArchivedModal(false)} title="Archived Documents">
                {isLoadingModal ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {archivedDocs.length > 0 ? (
                                    archivedDocs.map(doc => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button onClick={() => handleRestore(doc)} className="text-green-600 hover:text-green-900">
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="2" className="px-6 py-4 text-center text-gray-500">No archived documents found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
