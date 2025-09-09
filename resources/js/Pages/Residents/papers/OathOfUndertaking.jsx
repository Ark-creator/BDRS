import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SignaturePad from '@/Components/Residents/SignaturePad';

export default function OathOfUndertaking({ documentType, userProfile }) {
    const { data, setData, post, processing, errors } = useForm({
        document_type_id: documentType.id,
        purpose: '',
        other_purpose: '',
        specific_undertaking: '',
        signature_data: '',
    });

    const purposeOptions = [
        'Business Permit Application',
        'Employment Requirement',
        'Scholarship Application',
        'Government Transaction',
        'Others'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('residents.request.store'));
    };

    const handleSignatureChange = (signatureData) => {
        setData('signature_data', signatureData);
    };

    return (
        <AuthenticatedLayout
            user={usePage().props.auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request {documentType.name}</h2>}
        >
            <Head title={`Request ${documentType.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <h3 className="text-lg font-medium mb-4">{documentType.name} Request Form</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Purpose */}
                                <div>
                                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Purpose *
                                    </label>
                                    <select
                                        id="purpose"
                                        value={data.purpose}
                                        onChange={(e) => setData('purpose', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">Select Purpose</option>
                                        {purposeOptions.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    {errors.purpose && <div className="text-red-500 text-sm mt-1">{errors.purpose}</div>}
                                </div>

                                {data.purpose === 'Others' && (
                                    <div>
                                        <label htmlFor="other_purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Specify Other Purpose *
                                        </label>
                                        <input
                                            id="other_purpose"
                                            type="text"
                                            value={data.other_purpose}
                                            onChange={(e) => setData('other_purpose', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required={data.purpose === 'Others'}
                                        />
                                        {errors.other_purpose && <div className="text-red-500 text-sm mt-1">{errors.other_purpose}</div>}
                                    </div>
                                )}

                                {/* Specific Undertaking */}
                                <div>
                                    <label htmlFor="specific_undertaking" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Specific Undertaking *
                                    </label>
                                    <textarea
                                        id="specific_undertaking"
                                        value={data.specific_undertaking}
                                        onChange={(e) => setData('specific_undertaking', e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Please specify what you are undertaking to do..."
                                        required
                                    />
                                    {errors.specific_undertaking && <div className="text-red-500 text-sm mt-1">{errors.specific_undertaking}</div>}
                                </div>

                                {/* Signature */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Signature *
                                    </label>
                                    <SignaturePad onSignatureChange={handleSignatureChange} />
                                    {errors.signature_data && <div className="text-red-500 text-sm mt-1">{errors.signature_data}</div>}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring focus:ring-blue-300 disabled:opacity-25 transition"
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