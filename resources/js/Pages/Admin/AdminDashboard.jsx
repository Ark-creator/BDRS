import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Links from "@/Components/admin/Links";
import { Head } from "@inertiajs/react";

export default function AdminDashboard() {
  return (
      <AuthenticatedLayout
      
      >
        <Head title="Admin Dashboard" />
  
        <div className="flex">
          <aside className="w-64 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <Links />
          </aside>
  
          <main className="">
        
          </main>
        </div>
      </AuthenticatedLayout>
    );
  }

// ace