// resources/js/Pages/Admin/dashboard.jsx
import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Links from "@/Components/admin/Links";
import { Head } from "@inertiajs/react";

export default function Dashboard() {
  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200">Admin Dashboard</h2>}
    >
      <Head title="Admin Dashboard" />

      <div className="flex">
        <aside className="w-64 bg-gray-100 dark:bg-gray-900 min-h-screen">
          <Links />
        </aside>

        <main className="flex-1 p-6">
          Dashboard Content Here
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
