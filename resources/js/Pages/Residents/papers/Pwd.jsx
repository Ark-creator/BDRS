import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput'; // Assuming you have a standard SelectInput component

export default function PWD({ auth, documentType }) {
    
    // --- UPDATED useForm state to include disability fields ---
    const { data, setData, post, processing, errors } = useForm({
        purpose: 'For PWD ID Application',
        disability_type: '',      // For the dropdown selection
        other_disability: '',     // For the 'Others' text input
        document_type_id: documentType.id,
    });

    // List of disability options for the dropdown
    const disabilityOptions = [
        'Psychosocial Disability',
        'Disability Due to Chronic Illness',
        'Learning Disability',
        'Mental Disability',
        'Visual Disability',
        'Orthopedic (Musculoskeletal) Disability',
        'Communication Disability',
    ];

    const submit = (e) => {
        e.preventDefault();
        // The 'data' object now includes disability_type and other_disability
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
                                {documentType.requirements_description || 'No specific requirements listed.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <input type="hidden" name="document_type_id" value={data.document_type_id} />

                            {/* --- NEW: Disability Type Dropdown --- */}
                            <div>
                                <InputLabel htmlFor="disability_type" value="Type of Disability" />
                                <SelectInput
                                    id="disability_type"
                                    name="disability_type"
                                    value={data.disability_type}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('disability_type', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a disability type</option>
                                    {disabilityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                    <option value="Others">Others (Please specify)</option>
                                </SelectInput>
                                <InputError message={errors.disability_type} className="mt-2" />
                            </div>

                            {/* --- NEW: Conditional Input for "Others" --- */}
                            {data.disability_type === 'Others' && (
                                <div>
                                    <InputLabel htmlFor="other_disability" value="Please Specify Your Disability" />
                                    <TextInput
                                        id="other_disability"
                                        name="other_disability"
                                        value={data.other_disability}
                                        onChange={(e) => setData('other_disability', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                        placeholder="e.g., Rare Genetic Condition"
                                    />
                                    <InputError message={errors.other_disability} className="mt-2" />
                                </div>
                            )}

                            {/* --- Purpose of Request Field --- */}
                            {/* <div>
                                <InputLabel htmlFor="purpose" value="Purpose of Request" />
                                <TextInput
                                    id="purpose"
                                    name="purpose"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={errors.purpose} className="mt-2" />
                            </div> */}

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