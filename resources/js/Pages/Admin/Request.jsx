import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";

export default function Request() {
  const { documentRequests } = usePage().props;
  console.log("documentRequests:", documentRequests);

  // Helper function to safely get purpose from form_data
  const getPurpose = (formData) => {
    if (!formData) {
      return "N/A";
    }

    let parsedData = formData;

    // If form_data is a string, attempt to parse it
    if (typeof formData === 'string') {
      try {
        parsedData = JSON.parse(formData);
        // If the parsedData itself is *another* string, try parsing again
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
      } catch (e) {
        console.error("Failed to parse form_data JSON:", e, formData);
        return "Invalid Data"; // Or just "N/A"
      }
    }

    // Now safely access the purpose key
    return parsedData?.purpose || "N/A";
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Requests</h2>}
    >
      <Head title="Requests" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight mb-4">
                Document Requests
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Requestor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Document Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {documentRequests.length > 0 ? (
                      documentRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {request.user?.full_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {request.document_type?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getPurpose(request.form_data)} {/* Use the helper function here */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {request.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No requests found.
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