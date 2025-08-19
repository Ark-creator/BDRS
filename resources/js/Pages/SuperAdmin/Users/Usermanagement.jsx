import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import EditUserModal from '@/components/editUsermodal';

// Tailwind CSS classes for consistent styling
const roleBadgeClasses = {
    resident: 'bg-blue-50 text-blue-600 ring-blue-500/10',
    admin: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
    super_admin: 'bg-red-50 text-red-600 ring-red-500/10',
};

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

export default function UserManagement({ auth, users: initialUsers, filters }) {
    const { flash } = usePage().props;
    const [localUsers, setLocalUsers] = useState(initialUsers.data);

    // State for managing the edit modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // State for showing the spinner during role update
    const [updatingUser, setUpdatingUser] = useState(null);

    // State for filters and sorting, initialized from props
    const [params, setParams] = useState({
        search: filters.search || '',
        role: filters.role || 'all',
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc',
    });

    // Update local users when Inertia props change (e.g., after pagination)
    useEffect(() => {
        setLocalUsers(initialUsers.data);
    }, [initialUsers.data]);

    // This effect handles debouncing for API calls when filters change
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('superadmin.users.index'), params, {
                preserveState: true,
                replace: true,
            });
        }, 300); // 300ms delay to avoid API calls on every keystroke

        return () => clearTimeout(timeout);
    }, [params]);

    // Show toast messages from flash props
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            router.reload({ only: ['users'] });
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Handlers for opening and closing the edit modal
    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const startTour = () => {
        const targetUser = localUsers.find(user => user.role !== 'super_admin') || localUsers[0];
        const roleSelectorId = targetUser ? `#user-role-selector-${targetUser.id}` : null;

        const driverObj = driver({ /* ... your driver config ... */ });

        if (roleSelectorId) {
             driverObj.drive();
        } else {
            toast.error("User tour cannot start. No user roles to demonstrate.");
        }
    };

    // Handle role change with Inertia.js patch request
    const handleRoleChange = (e, user) => {
        const newRole = e.target.value;
        if (user.id === auth.user.id && newRole !== 'super_admin') {
            toast.error("You cannot change your own role from 'super_admin'.");
            e.target.value = user.role; // Revert the select change
            return;
        }

        setUpdatingUser(user.id);
        router.patch(route('superadmin.users.updateRole', { user: user.id }), {
            role: newRole,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Role updated to ${newRole} for ${user.full_name}.`);
            },
            onError: (errors) => {
                toast.error(errors.role || 'Failed to update user role.');
            },
            onFinish: () => {
                setUpdatingUser(null);
            }
        });
    };

    // Single handler to update params state for filters/search
    const handleQueryChange = (key, value) => {
        setParams(prevParams => ({ ...prevParams, [key]: value, page: 1 }));
    };

    // Handle sorting logic
    const handleSort = (column) => {
        const newSortOrder = (params.sortBy === column && params.sortOrder === 'asc') ? 'desc' : 'asc';
        setParams(prevParams => ({ ...prevParams, sortBy: column, sortOrder: newSortOrder, page: 1 }));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="User Management" />

            {/* Render the modal conditionally */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    isOpen={isModalOpen}
                    onClose={handleCloseEditModal}
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
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {localUsers.length > 0 ? (
                                        localUsers.map((user, index) => (
                                            <tr key={user.id} className={`transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${user.id === auth.user.id ? 'border-l-4 border-blue-500' : ''} hover:bg-blue-100`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {updatingUser === user.id ? ( <LoadingSpinner />) : (
                                                        <select id={`user-role-selector-${user.id}`} value={user.role} onChange={(e) => handleRoleChange(e, user)} className={`block w-auto rounded-md px-3 py-1 text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${roleBadgeClasses[user.role]} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`} disabled={user.id === auth.user.id && user.role === 'super_admin'}>
                                                            <option value="resident">Resident</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="super_admin">Super Admin</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button onClick={() => handleOpenEditModal(user)} className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out">Edit</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-lg">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <p>Walang user na nakita.</p>
                                                </div>
                                            </td>
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
    // Use a ternary operator: if link.url exists, render a Link. Otherwise, render a span.
    link.url ? (
        <Link
            key={index}
            href={link.url}
            preserveState
            className={`px-3 py-1 rounded-md transition duration-200 ${link.active ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-200'}`}
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