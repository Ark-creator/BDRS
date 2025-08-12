import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

// This component receives the specific 'documentType' prop for "Solo Parent"
export default function SoloParent({ auth, documentType }) {
    
    const { data, setData, post, processing, errors } = useForm({
        purpose: 'For Solo Parent Assistance', // You can set a custom default purpose here
        document_type_id: documentType.id,
    });

    const submit = (e) => {
        e.preventDefault();
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
                            <input type="hidden" value={data.document_type_id} />

                            <div>
                                <InputLabel htmlFor="purpose" value="Purpose of Request" />
                                <TextInput
                                    id="purpose"
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={errors.purpose} className="mt-2" />
                            </div>

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