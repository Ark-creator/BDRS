// resources/js/Pages/Admin/Announcement.jsx

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Announcement() {
  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Announcements</h2>}
    >
      <Head title="Announcements" />

      {/* Ito na lang ang laman.
          Ang layout na ang bahala sa sidebar. 
      */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              Dito mo ilalagay ang form para gumawa ng bagong announcement o ang listahan ng mga announcements.
            </div>
          </div>
        </div>
      </div>
      
    </AuthenticatedLayout>
  );
}