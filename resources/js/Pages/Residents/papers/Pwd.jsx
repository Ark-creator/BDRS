import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';

// Tumanggap ng 'auth' prop mula sa Laravel
export default function Pwd({ auth }) {
    return (
        // Gamitin ang parehong layout para sa consistent na design
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">PWD ID Application</h2>}
        >
            {/* Palitan ang title ng page para sa browser tab */}
            <Head title="PWD Application" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">

                            {/*
                            =========================================================
                            Dito mo ilalagay ang content para sa PWD Application page.
                            =========================================================
                            SAMPLE LANG TO
                            */}

                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                PWD ID Application Form
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Please ensure all information is correct. A valid medical certificate is required for new applicants.
                            </p>

                            <form className="mt-6 space-y-6">
                                {/* Example Form Field: Full Name */}
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

                                {/* Example Form Field: Type of Disability (Dropdown) */}
                                <div>
                                    <label htmlFor="disability_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type of Disability</label>
                                    <select
                                        id="disability_type"
                                        name="disability_type"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                    >
                                        <option>Psychosocial Disability</option>
                                        <option>Disability Due to Chronic Illness</option>
                                        <option>Learning Disability</option>
                                        <option>Mental Disability</option>
                                        <option>Visual Disability</option>
                                        <option>Orthopedic (Musculoskeletal) Disability</option>
                                        <option>Communication Disability</option>
                                    </select>
                                </div>

                                {/* Example Form Field: File Upload */}
                                <div>
                                    <label htmlFor="medical_certificate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Medical Certificate
                                    </label>
                                    <input
                                        type="file"
                                        name="medical_certificate"
                                        id="medical_certificate"
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG up to 5MB.</p>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Submit Application
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