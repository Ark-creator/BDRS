import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import 'driver.js/dist/driver.css';
import EditUserModal from '@/components/EditUserModal';
import VerificationModal from '@/components/VerificationModal';

// --- ICONS & STYLING ---

// NEW: Icons para sa bawat status
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);
const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const roleBadgeClasses = {
    resident: 'bg-blue-50 text-blue-600 ring-blue-500/10',
    admin: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
    super_admin: 'bg-red-50 text-red-600 ring-red-500/10',
};
const verificationBadgeClasses = {
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    unverified: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-blue-100 text-blue-800',
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const LoadingSpinner = () => (
    <div className="flex items-center space-x-2 text-blue-500">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Updating...</span>
    </div>
);


// UPDATED: In-update ko ang badge para magpakita ng iba't ibang icon
const VerificationStatusBadge = ({ status }) => {
    const baseClasses = 'px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full capitalize';
    const statusClass = verificationBadgeClasses[status] || 'bg-gray-100 text-gray-800';

    const getIcon = () => {
        switch (status) {
            case 'verified':
                return <CheckCircleIcon />;
            case 'pending_verification':
            case 'unverified':
                return <ClockIcon />;
            case 'rejected':
                return <XCircleIcon />;
            default:
                return null;
        }
    };

    return (
        <span className={`${baseClasses} ${statusClass}`}>
            {getIcon()}
            {status.replace('_', ' ')}
        </span>
    );
};


export default function UserManagement({ auth, users: initialUsers, filters }) {
    const { flash } = usePage().props;
    const [localUsers, setLocalUsers] = useState(initialUsers.data);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [reviewingUser, setReviewingUser] = useState(null);

    const [updatingUserRole, setUpdatingUserRole] = useState(null);
    const [updatingVerification, setUpdatingVerification] = useState(null);

    const [params, setParams] = useState({
        search: filters.search || '',
        role: filters.role || 'all',
        status: filters.status || 'all',
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc',
    });

    useEffect(() => {
        setLocalUsers(initialUsers.data);
    }, [initialUsers.data]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('superadmin.users.index'), params, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timeout);
    }, [params]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleOpenEditModal = (user) => { setEditingUser(user); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setEditingUser(null); setIsEditModalOpen(false); };
    const handleOpenVerificationModal = (user) => { setReviewingUser(user); setIsVerificationModalOpen(true); };
    const handleCloseVerificationModal = () => { setReviewingUser(null); setIsVerificationModalOpen(false); };

    const handleRoleChange = (e, user) => {
        const newRole = e.target.value;
        setUpdatingUserRole(user.id);
        router.patch(route('superadmin.users.updateRole', { user: user.id }), { role: newRole }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Role updated for ${user.full_name}.`),
            onError: (errors) => toast.error(errors.role || 'Failed to update user role.'),
            onFinish: () => setUpdatingUserRole(null),
        });
    };

    const handleVerificationChange = (user, newStatus) => {
        setUpdatingVerification(user.id);
        router.patch(route('superadmin.users.verify', { user: user.id }), { verification_status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Verification status updated for ${user.full_name}.`);
                handleCloseVerificationModal();
            },
            onError: (errors) => toast.error(errors.verification_status || 'Failed to update status.'),
            onFinish: () => setUpdatingVerification(null),
        });
    };

    const handleQueryChange = (key, value) => {
        setParams(prevParams => ({ ...prevParams, [key]: value, page: 1 }));
    };

    const handleSort = (column) => {
        const newSortOrder = (params.sortBy === column && params.sortOrder === 'asc') ? 'desc' : 'asc';
        setParams(prevParams => ({ ...prevParams, sortBy: column, sortOrder: newSortOrder, page: 1 }));
    };

    const Toggles = [
        { key: 'all', label: 'All Users' },
        { key: 'verified', label: 'Verified' },
        { key: 'unverified', label: 'Unverified' },
    ];

    return (
        <>
            {/* NEW: Custom CSS para sa responsive table */}
            <style>{`
                @media (max-width: 767px) {
                    .responsive-table thead {
                        display: none;
                    }
                    .responsive-table tr {
                        display: block;
                        margin-bottom: 1rem;
                        border: 1px solid #e2e8f0;
                        border-radius: 0.5rem;
                        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    }
                    .responsive-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        border-bottom: 1px solid #e2e8f0;
                        text-align: right;
                    }
                    .responsive-table td:last-child {
                        border-bottom: none;
                    }
                    .responsive-table td::before {
                        content: attr(data-label);
                        font-weight: 600;
                        text-align: left;
                        margin-right: 1rem;
                    }
                }
            `}</style>

            <AuthenticatedLayout user={auth.user}>
                <Head title="User Management" />

                {editingUser && <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={handleCloseEditModal} />}
                {reviewingUser && <VerificationModal user={reviewingUser} isOpen={isVerificationModalOpen} onClose={handleCloseVerificationModal} onVerify={handleVerificationChange} onReject={handleVerificationChange} isUpdating={!!updatingVerification} />}

                <div className="py-12 bg-slate-50 min-h-screen font-sans antialiased">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            {/* Header Section */}
                            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                                <div>
                                    <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Users</h3>
                                    <p className="mt-1 text-gray-500 max-w-2xl text-sm">View and manage all registered accounts, roles, and user details.</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <input type="text" placeholder="Search..." value={params.search} onChange={(e) => handleQueryChange('search', e.target.value)} className="block w-full sm:w-52 rounded-md border-gray-300 py-2 text-sm focus:border-blue-500 focus:ring-blue-500" />
                                    <select value={params.role} onChange={(e) => handleQueryChange('role', e.target.value)} className="block w-36 rounded-md border-gray-300 py-2 text-sm focus:border-blue-500 focus:ring-blue-500">
                                        <option value="all">All Roles</option>
                                        <option value="resident">Resident</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                            </div>

                            {/* Verification Toggle Buttons */}
                            <div className="p-4 px-6 border-b border-gray-200">
                                <div className="p-1 inline-flex space-x-1 bg-gray-100 rounded-lg">
                                    {Toggles.map(toggle => (
                                        <button key={toggle.key} onClick={() => handleQueryChange('status', toggle.key)}
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${params.status === toggle.key ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                                            {toggle.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Table */}
                            <div className="p-4 md:p-0">
                                <table className="min-w-full responsive-table">
                                    <thead className="bg-blue-600 text-white">
                                        <tr>
                                            <th scope="col" onClick={() => handleSort('full_name')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer">Name</th>
                                            <th scope="col" onClick={() => handleSort('email')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer">Email</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                                            <th scope="col" onClick={() => handleSort('created_at')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer">Registered On</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Verification</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {localUsers.length > 0 ? (
                                            localUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td data-label="Name" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                                    <td data-label="Email" className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                    <td data-label="Role" className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {updatingUserRole === user.id ? <LoadingSpinner /> : (
                                                            <select value={user.role} onChange={(e) => handleRoleChange(e, user)} className={`block w-auto rounded-md px-3 py-1 text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${roleBadgeClasses[user.role]}`} disabled={user.id === auth.user.id && user.role === 'super_admin'}>
                                                                <option value="resident">Resident</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td data-label="Registered On" className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                                                    <td data-label="Verification" className="px-6 py-4 whitespace-nowrap text-sm"><VerificationStatusBadge status={user.verification_status} /></td>
                                                    <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button onClick={() => handleOpenVerificationModal(user)} className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-md hover:bg-yellow-600 transition-colors">Review</button>
                                                            <button onClick={() => handleOpenEditModal(user)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors"><EditIcon /> <span className="ml-1">Edit</span></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No users found for the selected filters.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination links */}
                            {initialUsers.links && initialUsers.total > initialUsers.per_page && (
                                <div className="p-6 flex justify-between items-center text-sm text-gray-600 border-t border-gray-200">
                                    <div>Showing <span className="font-bold">{initialUsers.from}</span> to <span className="font-bold">{initialUsers.to}</span> of <span className="font-bold">{initialUsers.total}</span> results</div>
                                    <div className="flex space-x-1">
                                        {initialUsers.links.map((link, index) => (
                                            link.url ? (
                                                <Link key={index} href={link.url} preserveState className={`px-3 py-1 rounded-md transition ${link.active ? 'bg-blue-600 text-white' : 'hover:bg-blue-500 hover:text-white'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                            ) : (
                                                <span key={index} className="px-3 py-1 rounded-md text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}