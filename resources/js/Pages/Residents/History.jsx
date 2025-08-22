import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function History({ auth, requestHistory }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Request History</h2>}
        >
            <Head title="Request History" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {requestHistory.data.length > 0 ? (
                                <div className="space-y-4">
                                    {requestHistory.data.map((request) => (
                                        <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                <div className="flex-grow">
                                                    <h3 className={clsx("text-lg font-bold", {
                                                        'text-red-600 dark:text-red-400': request.status === 'Rejected',
                                                        'text-green-600 dark:text-green-400': request.status === 'Claimed',
                                                    })}>
                                                        {request.document_type.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Requested on: {format(new Date(request.original_created_at), 'MMMM d, yyyy h:mm a')}
                                                    </p>
                                                </div>
                                                <span className={clsx("mt-2 sm:mt-0 text-sm font-medium px-2.5 py-0.5 rounded-full", {
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': request.status === 'Rejected',
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': request.status === 'Claimed',
                                                })}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            {/* Conditionally render details based on status */}
                                            {request.status === 'Rejected' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Reason for Rejection:</h4>
                                                    <blockquote className="text-gray-700 dark:text-gray-300 mt-1 italic border-l-4 border-red-300 pl-4">
                                                        {request.admin_remarks || "No reason provided."}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {request.status === 'Claimed' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                     <p className="text-sm text-gray-600 dark:text-gray-300">This document has been successfully claimed.</p>
                                                </div>
                                            )}
                                            {request.processor && request.processor.profile && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-right">
                                                    Processed by: {request.processor.profile.first_name} {request.processor.profile.last_name}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>You have no claimed or rejected document requests in your history.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
