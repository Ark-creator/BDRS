import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput'; // Assuming you have this component

export default function RequestGpIndigency({ auth, documentType }) {
    
    // --- useForm state adapted for GP Indigency purpose fields ---
    const { data, setData, post, processing, errors } = useForm({
        purpose: '',            // For the dropdown selection
        other_purpose: '',      // For the 'Others' text input
        document_type_id: documentType.id,
    });

    // List of purpose options for the dropdown
    const purposeOptions = [
        'Medical Assistance',
        'Educational Assistance / Scholarship',
        'Legal Aid / PAO Requirement',
        'Burial / Funeral Assistance',
        'First Time Jobseeker Requirement (RA 11261)',
        'Livelihood Program Application',
    ];

    const submit = (e) => {
        e.preventDefault();
        // The 'data' object now includes the purpose and other_purpose
        post(route('residents.request.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Request: {documentType.name}</h2>}
        >
            <Head title={`Request ${documentType.name}`} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold">Requirements:</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                {documentType.requirements_description || 'No specific requirements listed. Please proceed with your request.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <input type="hidden" name="document_type_id" value={data.document_type_id} />

                            {/* --- Purpose Dropdown --- */}
                            <div>
                                <InputLabel htmlFor="purpose" value="Specific Purpose" />
                                <SelectInput
                                    id="purpose"
                                    name="purpose"
                                    value={data.purpose}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Select a purpose --</option>
                                    {purposeOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                    <option value="Others">Others (Please specify)</option>
                                </SelectInput>
                                <InputError message={errors.purpose} className="mt-2" />
                            </div>

                            {/* --- Conditional Input for "Others" --- */}
                            {data.purpose === 'Others' && (
                                <div>
                                    <InputLabel htmlFor="other_purpose" value="Please Specify Your Purpose" />
                                    <TextInput
                                        id="other_purpose"
                                        name="other_purpose"
                                        value={data.other_purpose}
                                        onChange={(e) => setData('other_purpose', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                        placeholder="Enter your specific purpose here"
                                    />
                                    <InputError message={errors.other_purpose} className="mt-2" />
                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing}>
                                    Submit Request
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}