// resources/js/Pages/Admin/Request.jsx

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Request() {
  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Requests</h2>}
    >
      <Head title="Requests" />

      {/* Place the unique content for the requests page here. */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              This is where you will display the list or table of user requests.
            </div>
          </div>
        </div>
      </div>
      
    </AuthenticatedLayout>
  );
}