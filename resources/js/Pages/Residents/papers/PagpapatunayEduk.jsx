import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SignaturePad from '@/Components/Residents/SignaturePad';

export default function PagpapatunayEduk({ documentType, userProfile }) {
    const { data, setData, post, processing, errors } = useForm({
        document_type_id: documentType.id,
        school_name: '',
        school_address: '',
        course_program: '',
        year_level: '',
        academic_year: '',
        purpose: '',
        other_purpose: '',
        signature_data: '',
    });

    const purposeOptions = [
        'Scholarship Application',
        'Enrollment Requirement',
        'Transfer Credentials',
        'Employment Requirement',
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
                                {/* School Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            School Name *
                                        </label>
                                        <input
                                            id="school_name"
                                            type="text"
                                            value={data.school_name}
                                            onChange={(e) => setData('school_name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.school_name && <div className="text-red-500 text-sm mt-1">{errors.school_name}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="school_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            School Address *
                                        </label>
                                        <input
                                            id="school_address"
                                            type="text"
                                            value={data.school_address}
                                            onChange={(e) => setData('school_address', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.school_address && <div className="text-red-500 text-sm mt-1">{errors.school_address}</div>}
                                    </div>
                                </div>

                                {/* Course Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label htmlFor="course_program" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Course/Program *
                                        </label>
                                        <input
                                            id="course_program"
                                            type="text"
                                            value={data.course_program}
                                            onChange={(e) => setData('course_program', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.course_program && <div className="text-red-500 text-sm mt-1">{errors.course_program}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="year_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Year Level *
                                        </label>
                                        <input
                                            id="year_level"
                                            type="text"
                                            value={data.year_level}
                                            onChange={(e) => setData('year_level', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.year_level && <div className="text-red-500 text-sm mt-1">{errors.year_level}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Academic Year *
                                        </label>
                                        <input
                                            id="academic_year"
                                            type="text"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        {errors.academic_year && <div className="text-red-500 text-sm mt-1">{errors.academic_year}</div>}
                                    </div>
                                </div>

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