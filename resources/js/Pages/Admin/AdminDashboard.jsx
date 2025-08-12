import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function AdminDashboard() {
  return (
    // Ang AuthenticatedLayout na ang bahala sa Navbar at Sidebar
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Admin Dashboard</h2>}
    >
      <Head title="Admin Dashboard" />

      {/* Ito na lang ang content ng page mo.
        WALA NANG <aside> or <main> tags dito.
      */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              Welcome to the Admin Dashboard! Dito mo ilalagay ang mga stats, charts, etc.
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}