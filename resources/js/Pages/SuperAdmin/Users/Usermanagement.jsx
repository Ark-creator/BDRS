import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import EditUserModal from '@/components/EditUserModal';
import VerificationModal from '@/components/VerificationModal';

// Tailwind CSS classes for consistent styling
const roleBadgeClasses = {
    resident: 'bg-blue-50 text-blue-600 ring-blue-500/10',
    admin: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
    super_admin: 'bg-red-50 text-red-600 ring-red-500/10',
};

// Tailwind CSS classes for verification status badges
const verificationBadgeClasses = {
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    unverified: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-blue-100 text-blue-800',
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center space-x-2 text-blue-500">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Updating...</span>
    </div>
);

// Verification Status Badge Component
const VerificationStatusBadge = ({ status }) => {
    const baseClasses = 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize';
    const statusClass = verificationBadgeClasses[status] || 'bg-gray-100 text-gray-800';
    return <span className={`${baseClasses} ${statusClass}`}>{status.replace('_', ' ')}</span>;
};

export default function UserManagement({ auth, users: initialUsers, filters }) {
    const { flash } = usePage().props;
    const [localUsers, setLocalUsers] = useState(initialUsers.data);

    // State for modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [reviewingUser, setReviewingUser] = useState(null);

    // State for spinners
    const [updatingUserRole, setUpdatingUserRole] = useState(null);
    const [updatingVerification, setUpdatingVerification] = useState(null);

    // State for filters and sorting
    const [params, setParams] = useState({
        search: filters.search || '',
        role: filters.role || 'all',
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

    // Handlers for Edit Modal
    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setEditingUser(null);
        setIsEditModalOpen(false);
    };

    // Handlers for Verification Modal
    const handleOpenVerificationModal = (user) => {
        setReviewingUser(user);
        setIsVerificationModalOpen(true);
    };
    const handleCloseVerificationModal = () => {
        setReviewingUser(null);
        setIsVerificationModalOpen(false);
    };

    const startTour = () => {
        // ... tour logic remains the same
    };

    const handleRoleChange = (e, user) => {
        const newRole = e.target.value;
        if (user.id === auth.user.id && newRole !== 'super_admin') {
            toast.error("You cannot change your own role from 'super_admin'.");
            e.target.value = user.role;
            return;
        }
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
                handleCloseVerificationModal(); // Close modal on success
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="User Management" />

            {/* --- FIX: Conditionally Render Modals --- */}
            {/* Only render the modal if there is a user to edit/review */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                />
            )}
            
            {reviewingUser && (
                 <VerificationModal
                    user={reviewingUser}
                    isOpen={isVerificationModalOpen}
                    onClose={handleCloseVerificationModal}
                    onVerify={handleVerificationChange}
                    onReject={handleVerificationChange}
                    isUpdating={!!updatingVerification}
                />
            )}

            <div className="py-12 bg-slate-50 min-h-screen font-sans antialiased">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200">
                        {/* Header Section */}
                        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <div id="page-title">
                                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Users</h3>
                                <p className="mt-1 text-gray-500 max-w-2xl text-sm">View and manage all registered accounts, roles, and user details.</p>
                            </div>
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                    </span>
                                    <input id="search-input" type="text" placeholder="Search by name or email" value={params.search} onChange={(e) => handleQueryChange('search', e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition duration-200" />
                                </div>
                                <select id="role-filter" value={params.role} onChange={(e) => handleQueryChange('role', e.target.value)} className="block w-40 rounded-md border-gray-300 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500 transition duration-200">
                                    <option value="all">All Roles</option>
                                    <option value="resident">Resident</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                                <button onClick={startTour} className="flex items-center gap-1 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Start tour">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L7 9.167A1 1 0 007 10.833L9.133 13.5a1 1 0 001.734 0L13 10.833A1 1 0 0013 9.167L10.867 6.5A1 1 0 0010 7z" clipRule="evenodd" /></svg>
                                    <span className="text-xs">Need Help?</span>
                                </button>
                            </div>
                        </div>

                        {/* User Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-600 text-white" id="users-table-thead">
                                    <tr>
                                        <th scope="col" onClick={() => handleSort('full_name')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-800 transition">Name</th>
                                        <th scope="col" onClick={() => handleSort('email')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-800 transition">Email</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                                        <th scope="col" onClick={() => handleSort('created_at')} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-800 transition">Registered On</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Verification</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {localUsers.length > 0 ? (
                                        localUsers.map((user) => (
                                            <tr key={user.id} className={`hover:bg-blue-50`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {updatingUserRole === user.id ? <LoadingSpinner /> : (
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(e, user)}
                                                            className={`block w-auto rounded-md px-3 py-1 text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${roleBadgeClasses[user.role]}`}
                                                            disabled={user.id === auth.user.id && user.role === 'super_admin'}
                                                        >
                                                            <option value="resident">Resident</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <VerificationStatusBadge status={user.verification_status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button onClick={() => handleOpenVerificationModal(user)} className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-md hover:bg-yellow-600 transition-colors">
                                                            Review
                                                        </button>
                                                        <button onClick={() => handleOpenEditModal(user)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors">
                                                            <EditIcon /> <span className="ml-1">Edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination links */}
                        {initialUsers.links && initialUsers.total > initialUsers.per_page && (
                            <div className="p-6 flex justify-between items-center text-sm text-gray-600 border-t border-gray-200" id="pagination-controls">
                                <div>Showing <span className="font-bold">{initialUsers.from}</span> to <span className="font-bold">{initialUsers.to}</span> of <span className="font-bold">{initialUsers.total}</span> results</div>
                                <div className="flex space-x-1">
                                {initialUsers.links.map((link, index) => (
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            preserveState
                                            className={`px-3 py-1 rounded-md transition duration-200 ${link.active ? 'bg-blue-600 text-white font-bold' : 'hover:text-white hover:bg-blue-600'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={index}
                                            className="px-3 py-1 rounded-md text-gray-400 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
