import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

// Tumanggap ng 'auth' prop para maipasa sa layout
export default function Akap({ auth }) {
    return (
        // Gamitin ang AuthenticatedLayout para may navigation at pare-pareho ang design
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request for AKAP</h2>}
        >
            {/* Ito ang title na lalabas sa browser tab */}
            <Head title="AKAP Request" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">

                            {/*
                            =========================================================
                            DITO MO ILALAGAY ANG LAMAN NG IYONG AKAP PAGE
                            Halimbawa: form, mga instructions, etc.
                            =========================================================
                            */}

                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                AKAP Document Request Form
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Please fill out the form completely and accurately.
                            </p>

                            {/* Dito mo ilalagay ang iyong mga input fields */}
                            <div className="mt-6">
                                {/* Example Form Field */}
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    id="full_name"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}