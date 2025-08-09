import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

// Tumanggap ng 'auth' prop mula sa Laravel para maipasa sa layout
export default function BrgyClearance({ auth }) {
    return (
        // Gamitin ang AuthenticatedLayout para sa pare-parehong itsura at navigation
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request for Barangay Clearance</h2>}
        >
            {/* Ito ang title na makikita sa browser tab */}
            <Head title="Barangay Clearance" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">

                            {/*
                            =========================================================
                            Dito mo ilalagay ang content para sa Barangay Clearance page.
                            Halimbawa: form, mga requirements, instructions, etc.
                            =========================================================
                            */}

                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                Barangay Clearance Request Form
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Please fill out the form completely and accurately. All fields are required.
                            </p>

                            {/* Dito mo ilalagay ang iyong mga input fields */}
                            <form className="mt-6 space-y-6">
                                {/* Example Form Field 1 */}
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        id="full_name"
                                        defaultValue={auth.user.name} // Pwedeng lagyan ng default value
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        readOnly
                                    />
                                </div>

                                {/* Example Form Field 2 */}
                                <div>
                                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
                                    <textarea
                                        name="purpose"
                                        id="purpose"
                                        rows="3"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g., Job Application, Bank Requirement, School Admission"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}