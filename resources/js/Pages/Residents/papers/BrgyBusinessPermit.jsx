import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

/**
 * BrgyBusinessPermit Component
 *
 * Displays a form for requesting a Barangay Business Permit. It auto-fills the owner's
 * data as read-only fields and uses Inertia's useForm hook for handling business details
 * and form submission.
 *
 * @param {object} auth - The authentication object from Inertia.
 * @param {object} userProfile - The logged-in user's profile data.
 * @param {object} documentType - Data about the document being requested (ID, name, requirements).
 */
export default function BrgyBusinessPermit({ auth, userProfile, documentType }) {

    const { data, setData, post, processing, errors } = useForm({
        business_name: '',
        business_type: '',
        business_address: '',
        document_type_id: documentType.id,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('residents.request.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request: {documentType.name}</h2>}
        >
            <Head title={`Request ${documentType.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">

                            {/* Requirements Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold">Requirements:</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {documentType.requirements_description || 'No specific requirements listed.'}
                                </p>
                            </div>

                            <hr className="my-6 border-gray-200 dark:border-gray-700" />

                            <form onSubmit={submit} className="mt-6 space-y-6">
                                <input type="hidden" name="document_type_id" value={data.document_type_id} />

                                {/* Section for Auto-filled Owner Information (Read-Only) */}
                                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Owner's Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="full_name" value="Owner's Full Name" />
                                        <TextInput
                                            id="full_name"
                                            type="text"
                                            className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
                                            value={`${userProfile?.first_name || ''} ${userProfile?.middle_name || ''} ${userProfile?.last_name || ''}`.trim()}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="owner_address" value="Owner's Address" />
                                        <TextInput
                                            id="owner_address"
                                            type="text"
                                            className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
                                            value={userProfile?.address || ''}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                {/* Section for Business Details (User Input) */}
                                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 pt-4">Business Details</h4>
                                <div className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="business_name" value="Business Name" />
                                        <TextInput
                                            id="business_name"
                                            type="text"
                                            value={data.business_name}
                                            onChange={(e) => setData('business_name', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="e.g., Aling Nena's Sari-Sari Store"
                                            isFocused={true}
                                            required
                                        />
                                        <InputError message={errors.business_name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="business_type" value="Business Type / Nature" />
                                        <TextInput
                                            id="business_type"
                                            type="text"
                                            value={data.business_type}
                                            onChange={(e) => setData('business_type', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="e.g., Retail, Food Service, Online Selling"
                                            required
                                        />
                                        <InputError message={errors.business_type} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="business_address" value="Business Address" />
                                        <textarea
                                            id="business_address"
                                            value={data.business_address}
                                            onChange={(e) => setData('business_address', e.target.value)}
                                            rows="3"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            placeholder="Enter the full address where the business is located"
                                            required
                                        ></textarea>
                                        <InputError message={errors.business_address} className="mt-2" />
                                    </div>
                                </div>

                                {/* Submission Button */}
                                <div className="flex justify-end pt-4">
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Submitting...' : 'Submit Request'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}