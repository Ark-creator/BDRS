import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import {
    ResponsiveTable,
    ResponsiveTableBody,
    ResponsiveTableCell,
    ResponsiveTableEmpty,
    ResponsiveTableHead,
    ResponsiveTableHeaderCell,
    ResponsiveTableRow,
} from '@/Components/ResponsiveTable';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Eye, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';

const statusClasses = {
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    review_required: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    queued: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
};

const formatStatus = (status) => (status || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const Score = ({ value }) => {
    if (value === null || value === undefined) {
        return <span className="text-slate-400">N/A</span>;
    }

    return <span className="font-semibold text-slate-800 dark:text-slate-100">{Number(value).toFixed(1)}%</span>;
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.draft}`}>
        {formatStatus(status)}
    </span>
);

const SummaryCard = ({ label, value, tone }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
);

const ReviewModal = ({ verification, onClose }) => {
    const { data, setData, post, processing, errors } = useForm({
        status: 'approved',
        notes: '',
    });

    if (!verification) return null;

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.verifications.review', verification.uuid), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Verification Review</h2>
                        <p className="text-sm text-slate-500">{verification.uuid}</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            {verification.id_image_url && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">ID Image</p>
                                    <img src={verification.id_image_url} alt="Submitted ID" className="aspect-video w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700" />
                                </div>
                            )}
                            {verification.selfie_image_url && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Selfie</p>
                                    <img src={verification.selfie_image_url} alt="Submitted selfie" className="aspect-video w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700" />
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-5">
                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Face</p><Score value={verification.face_match_score} /></div>
                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">OCR</p><Score value={verification.ocr_confidence} /></div>
                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Fake Risk</p><Score value={verification.fake_probability} /></div>
                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Liveness</p><Score value={verification.liveness_score} /></div>
                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Overall</p><Score value={verification.overall_score} /></div>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Extracted ID Data</h3>
                            <pre className="max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(verification.extracted_data || {}, null, 2)}</pre>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Audit Trail</h3>
                            <div className="space-y-2">
                                {(verification.logs || []).map((log) => (
                                    <div key={log.id} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
                                        <div className="flex justify-between gap-3">
                                            <span className="font-medium text-slate-800 dark:text-slate-100">{log.event}</span>
                                            <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="mt-1 text-slate-600 dark:text-slate-300">{log.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Resident</h3>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{verification.user?.full_name || verification.user?.email}</p>
                            <p className="text-xs text-slate-500">{verification.user?.email}</p>
                            <div className="mt-3"><StatusBadge status={verification.status} /></div>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                            <div className="mb-3 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-100">
                                <ShieldAlert size={18} />
                                Fraud Alerts
                            </div>
                            {(verification.fraud_alerts || []).length ? (
                                <div className="space-y-2">
                                    {verification.fraud_alerts.map((alert) => (
                                        <div key={alert.id} className="rounded-md bg-white p-3 text-sm dark:bg-gray-900">
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{alert.type}</p>
                                            <p className="text-slate-600 dark:text-slate-300">{alert.message}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-amber-800 dark:text-amber-100">No open fraud alerts.</p>
                            )}
                        </div>

                        <form onSubmit={submit} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Manual Decision</h3>
                            <select
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value)}
                                className="mt-3 w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            >
                                <option value="approved">Approve</option>
                                <option value="review_required">Keep in Review</option>
                                <option value="rejected">Reject</option>
                            </select>
                            <textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                rows="4"
                                className="mt-3 w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                placeholder="Review notes"
                            />
                            {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
                            <button disabled={processing} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                <CheckCircle2 size={16} />
                                Save Review
                            </button>
                        </form>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default function Verifications({ verifications, filters, summary, statuses }) {
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState(filters);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('admin.verifications.index'), filter, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Identity Verifications" />

            <div className="bg-slate-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-screen-2xl space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Identity Verifications</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">AI scores, fraud alerts, and manual review decisions.</p>
                        </div>
                        <form onSubmit={applyFilters} className="flex flex-col gap-2 sm:flex-row">
                            <select
                                value={filter.status}
                                onChange={(event) => setFilter({ ...filter, status: event.target.value })}
                                className="rounded-md border-slate-300 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                            >
                                {statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                            </select>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    value={filter.search}
                                    onChange={(event) => setFilter({ ...filter, search: event.target.value })}
                                    className="w-full rounded-md border-slate-300 pl-9 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:w-72"
                                    placeholder="Search resident or UUID"
                                />
                            </div>
                            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                                Apply
                            </button>
                        </form>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <SummaryCard label="Queued" value={summary.queued} tone="text-slate-700 dark:text-slate-100" />
                        <SummaryCard label="Processing" value={summary.processing} tone="text-blue-600" />
                        <SummaryCard label="Review" value={summary.review_required} tone="text-amber-600" />
                        <SummaryCard label="Approved" value={summary.approved} tone="text-green-600" />
                        <SummaryCard label="Rejected" value={summary.rejected} tone="text-red-600" />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-gray-800">
                        <ResponsiveTable>
                            <ResponsiveTableHead>
                                <tr>
                                    <ResponsiveTableHeaderCell>Resident</ResponsiveTableHeaderCell>
                                    <ResponsiveTableHeaderCell>Document</ResponsiveTableHeaderCell>
                                    <ResponsiveTableHeaderCell>Status</ResponsiveTableHeaderCell>
                                    <ResponsiveTableHeaderCell>Scores</ResponsiveTableHeaderCell>
                                    <ResponsiveTableHeaderCell>Submitted</ResponsiveTableHeaderCell>
                                    <ResponsiveTableHeaderCell className="text-center">Action</ResponsiveTableHeaderCell>
                                </tr>
                            </ResponsiveTableHead>
                            <ResponsiveTableBody>
                                {verifications.data.length ? verifications.data.map((verification) => (
                                    <ResponsiveTableRow key={verification.uuid} className="md:border-t md:border-slate-200 md:dark:border-slate-700">
                                        <ResponsiveTableCell label="Resident" className="font-medium text-slate-900 dark:text-white">
                                            <div>
                                                <p>{verification.user?.full_name || verification.user?.email}</p>
                                                <p className="text-xs font-normal text-slate-500">{verification.uuid}</p>
                                            </div>
                                        </ResponsiveTableCell>
                                        <ResponsiveTableCell label="Document" className="capitalize text-slate-600 dark:text-slate-300">
                                            {verification.document_type?.replaceAll('_', ' ')}
                                        </ResponsiveTableCell>
                                        <ResponsiveTableCell label="Status">
                                            <StatusBadge status={verification.status} />
                                        </ResponsiveTableCell>
                                        <ResponsiveTableCell label="Scores">
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
                                                <span>Face <Score value={verification.face_match_score} /></span>
                                                <span>Overall <Score value={verification.overall_score} /></span>
                                                <span>Live <Score value={verification.liveness_score} /></span>
                                                <span>Fake <Score value={verification.fake_probability} /></span>
                                            </div>
                                        </ResponsiveTableCell>
                                        <ResponsiveTableCell label="Submitted" className="text-slate-600 dark:text-slate-300">
                                            {verification.submitted_at ? new Date(verification.submitted_at).toLocaleString() : 'Not submitted'}
                                        </ResponsiveTableCell>
                                        <ResponsiveTableCell label="Action" contentClassName="flex justify-end md:justify-center">
                                            <button onClick={() => setSelected(verification)} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                                <Eye size={16} />
                                                Review
                                            </button>
                                        </ResponsiveTableCell>
                                    </ResponsiveTableRow>
                                )) : (
                                    <ResponsiveTableEmpty colSpan="6">
                                        <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                                        No identity verifications found.
                                    </ResponsiveTableEmpty>
                                )}
                            </ResponsiveTableBody>
                        </ResponsiveTable>
                        {verifications.data.length > 0 && (
                            <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                                <Pagination links={verifications.links} from={verifications.from} to={verifications.to} total={verifications.total} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReviewModal verification={selected} onClose={() => setSelected(null)} />
        </AuthenticatedLayout>
    );
}
