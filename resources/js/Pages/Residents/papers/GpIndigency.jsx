import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

export default function GpIndigency({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request for GP (General Purpose) Indigency</h2>}
        >
            <Head title="GP Indigency" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            
                            {/*
                            =========================================================
                            Dito mo ilalagay ang content para sa GP Indigency page.
                            =========================================================
                            */}

                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                GP (General Purpose) Indigency Request Form
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                This certificate is for general use. Please state your specific purpose below.
                            </p>

                            <form className="mt-6 space-y-6">
                                {/* Form Field: Full Name */}
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        id="full_name"
                                        defaultValue={auth.user.name}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        readOnly
                                    />
                                </div>

                                {/* Form Field: Address */}
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Complete Address</label>
                                    <textarea
                                        name="address"
                                        id="address"
                                        rows="2"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        placeholder="Your complete address"
                                    ></textarea>
                                </div>

                                {/* Form Field: Purpose */}
                                <div>
                                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specific Purpose</label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        id="purpose"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g., For legal aid, processing of documents, etc."
                                    />
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