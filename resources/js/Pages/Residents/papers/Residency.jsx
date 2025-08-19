import React, { useRef, useEffect } from "react"; // <-- Make sure to import useEffect
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SignatureCanvas from "react-signature-canvas";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Residency({ auth, errors, documentType }) {
    const sigCanvas = useRef(null);

    const { data, setData, post, processing, reset, wasSuccessful } = useForm({
        signature_data: "",
        document_type_id: documentType.id,
        // We add a flag to control when the form should actually be submitted.
        _isSubmitting: false, 
    });

    // This useEffect hook will watch for changes to our flag.
    // When `_isSubmitting` becomes true, it will fire the post request.
    useEffect(() => {
        // We only post if the flag is true and the signature data is not empty.
        if (data._isSubmitting && data.signature_data) {
            post(route("residents.request.store"), {
                // We must reset the flag when the request is done.
                onFinish: () => setData("_isSubmitting", false),
            });
        }
    }, [data._isSubmitting]); // This hook runs ONLY when `data._isSubmitting` changes.

    // This useEffect will reset the form ONLY after a successful submission.
    useEffect(() => {
        if(wasSuccessful) {
            reset();
            sigCanvas.current.clear();
        }
    }, [wasSuccessful]);

    const clearSignature = () => {
        sigCanvas.current.clear();
        setData("signature_data", "");
    };

    /**
     * The new submit handler.
     * Its ONLY job is to get the signature and update the state.
     * The useEffect hook will handle the actual submission.
     */
    const submit = (e) => {
        e.preventDefault();

        if (processing) return;

        if (sigCanvas.current.isEmpty()) {
            alert("Please provide a signature before submitting.");
            return;
        }

        const dataURL = sigCanvas.current.toDataURL("image/png");
        
        // Update the state with the signature and set the submitting flag to true.
        setData({ 
            ...data, 
            signature_data: dataURL, 
            _isSubmitting: true 
        });
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
                                {documentType.requirements_description || 'No specific requirements listed. Please provide your signature to proceed.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="signature" value="Your Signature" />
                                <div className="mt-1 relative w-full border border-gray-300 rounded-md">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor="black"
                                        canvasProps={{ className: "w-full h-40 rounded-md" }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        className="text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                                    >
                                        Clear Signature
                                    </button>
                                </div>
                                <InputError message={errors.signature_data} className="mt-2" />
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