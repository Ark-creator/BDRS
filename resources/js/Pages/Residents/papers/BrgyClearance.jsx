import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

/**
 * BrgyClearance Component
 *
 * This component displays a form for requesting a Barangay Clearance.
 * It auto-fills user data passed from the controller and handles form submission.
 *
 * @param {object} auth - The authentication object provided by Inertia.
 * @param {object} userProfile - The user's profile data from the database.
 */
export default function BrgyClearance({ auth, userProfile }) {

    /**
     * Calculates the age based on a birthdate string (e.g., "YYYY-MM-DD").
     * @param {string} birthdate - The birthdate string.
     * @returns {number|string} The calculated age or an empty string if birthdate is invalid.
     */
    const calculateAge = (birthdate) => {
        if (!birthdate) return '';
        const birthdayDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthdayDate.getFullYear();
        const monthDifference = today.getMonth() - birthdayDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdayDate.getDate())) {
            age--;
        }
        return age;
    };

    // Calculate the age using the birthday from the userProfile prop
    const computedAge = calculateAge(userProfile.birthday);

    // useForm hook to manage the form's state and submission.
    // We only need to manage the fields that the user can actually edit.
    const { data, setData, post, processing, errors } = useForm({
        purpose: '',
    });

    /**
     * Handles the form submission by sending a POST request to the server.
     * @param {object} e - The form submission event.
     */
    const submit = (e) => {
        e.preventDefault();
        post(route('residents.papers.brgyClearance.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request for Barangay Clearance</h2>}
        >
            <Head title="Barangay Clearance" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">

                            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                                Barangay Clearance Request Form
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Please review your information below and provide the purpose for this request.
                            </p>

                            <form onSubmit={submit} className="mt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name (Auto-filled) */}
                                    <div>
                                        <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
                                        <input
                                            id="full_name"
                                            type="text"
                                            defaultValue={`${userProfile.first_name} ${userProfile.middle_name || ''} ${userProfile.last_name}`.trim()}
                                            className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-700 border-transparent focus:ring-0"
                                            readOnly
                                        />
                                    </div>

                                    {/* Age (Auto-computed) */}
                                    <div>
                                        <label htmlFor="age" className="block text-sm font-medium">Age</label>
                                        <input
                                            id="age"
                                            type="text"
                                            defaultValue={computedAge}
                                            className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-700 border-transparent focus:ring-0"
                                            readOnly
                                        />
                                    </div>
                                    
                                    {/* Civil Status (Auto-filled) */}
                                    <div>
                                        <label htmlFor="civil_status" className="block text-sm font-medium">Civil Status</label>
                                        <input
                                            id="civil_status"
                                            type="text"
                                            defaultValue={userProfile.civil_status}
                                            className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-700 border-transparent focus:ring-0"
                                            readOnly
                                        />
                                    </div>

                                    {/* Address (Auto-filled) */}
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium">Address</label>
                                        <input
                                            id="address"
                                            type="text"
                                            defaultValue={userProfile.address}
                                            className="mt-1 block w-full rounded-md bg-gray-200 dark:bg-gray-700 border-transparent focus:ring-0"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                
                                {/* Purpose (User Input) */}
                                <div>
                                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose of Request</label>
                                    <textarea
                                        id="purpose"
                                        value={data.purpose}
                                        onChange={e => setData('purpose', e.target.value)}
                                        rows="3"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g., Job Application, Bank Requirement, School Admission"
                                        required
                                    ></textarea>
                                    {/* Display validation error from Laravel */}
                                    {errors.purpose && <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        disabled={processing}
                                    >
                                        {processing ? 'Submitting...' : 'Submit Request'}
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