import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, useForm, router } from "@inertiajs/react"; // Import 'router' here

export default function Documents() {
  const { documentTypes } = usePage().props;
  
  const [editingDocType, setEditingDocType] = useState(null);

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
  
  // FIX IS HERE: Use router.delete() instead of window.location.href
  const handleDelete = (docType) => {
    if (confirm(`Are you sure you want to delete ${docType.name}?`)) {
      router.delete(route('admin.documents.destroy', docType.id), {
        onSuccess: () => {
          // Optional: You can add a success message here if needed
          // alert('Document type deleted successfully!');
        },
        onError: (error) => {
          // Optional: Handle errors during deletion
          console.error('Error deleting document type:', error);
          alert('Failed to delete document type. Please try again.');
        }
      });
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
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 leading-tight mb-4">
                Available Document Types
              </h3>
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
                              <td className="px-6 py-4">
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full border-gray-300" />
                                {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full border-gray-300" />
                                {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={handleUpdate} disabled={processing} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Save</button>
                                <button onClick={() => setEditingDocType(null)} className="ml-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">{docType.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{docType.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleEditClick(docType)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                                <button onClick={() => handleDelete(docType)} className="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No document types found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}