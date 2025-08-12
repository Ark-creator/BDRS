// resources/js/Pages/Admin/Documents.jsx

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Documents() {
  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Documents</h2>}
    >
      <Head title="Documents" />

      {/* Ilagay na lang dito ang mismong content para sa documents page. */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              Dito mo ilalagay ang table o listahan ng mga dokumento.
            </div>
          </div>
        </div>
      </div>
      
    </AuthenticatedLayout>
  );
}