import React, { useRef } from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import SignatureCanvas from "react-signature-canvas";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

/**
 * Renders the form for requesting a Certificate of Residency.
 * This component requires a signature from the user.
 *
 * @param {object} props - The props passed from the Inertia controller.
 * @param {object} props.auth - The authentication object containing user data.
 * @param {object} props.errors - Validation errors, if any.
 * @param {object} props.documentType - The details of the document being requested.
 */
export default function Residency({ auth, errors, documentType }) {
    // Create a ref to access the signature canvas API
    const sigCanvas = useRef(null);

    // Initialize form data and methods using Inertia's useForm hook.
    const { data, setData, post, processing, reset } = useForm({
        signature_data: "",
        document_type_id: documentType.id,
    });

    /**
     * Clears the signature canvas and the corresponding form state.
     */
    const clearSignature = () => {
        sigCanvas.current.clear();
        setData("signature_data", "");
    };

    /**
     * Validates and saves the signature from the canvas to the form state as a Base64 string.
     * @returns {boolean} - True if the signature is captured and saved, false otherwise.
     */
    const saveSignature = () => {
        if (sigCanvas.current.isEmpty()) {
            alert("Please provide a signature before submitting.");
            return false;
        }
        // Get the signature as a Base64 PNG from the entire canvas.
        const dataURL = sigCanvas.current.toDataURL("image/png");

        setData("signature_data", dataURL);
        return true;
    };

    /**
     * Handles the form submission event.
     * @param {React.FormEvent} e - The form submission event.
     */
    const submit = (e) => {
        e.preventDefault();

        // Ensure the signature is captured before posting the form.
        if (!saveSignature()) {
            return; // Stop submission if the signature is missing.
        }

        // Post the form data to the backend using the named route.
        post(route("residents.request.store"), {
            onSuccess: () => reset(), // Clear the form on successful submission.
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
                                        canvasProps={{
                                            className: "w-full h-40 rounded-md",
                                        }}
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
