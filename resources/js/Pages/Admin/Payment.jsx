// resources/js/Pages/Admin/Payment.jsx

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Payment() {
  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Payments</h2>}
    >
      <Head title="Payments" />

      {/* Place the unique content for the payments page here. */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              This is where the payment records and transaction history will be displayed.
            </div>
          </div>
        </div>
      </div>
      
    </AuthenticatedLayout>
  );
}