import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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

export default function UserManagement({ auth, users: initialUsers }) {

    const { flash } = usePage().props;
    const [localUsers, setLocalUsers] = useState(initialUsers.data);
    const [updatingUser, setUpdatingUser] = useState(null);
    const [params, setParams] = useState({
        search: '',
        role: 'all',
        sortBy: 'full_name',
        sortOrder: 'asc',
    });

    // Show toast messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Setup and start the Driver.js tour
    const startTour = () => {
        // Find the first user with a non-'super_admin' role to demonstrate role change
        const targetUser = localUsers.find(user => user.role !== 'super_admin') || localUsers[0];
        const roleSelectorId = targetUser ? `#user-role-selector-${targetUser.id}` : null;

        const driverObj = driver({
            showProgress: true,
            steps: [
                {
                    element: '#page-title',
                    popover: {
                        title: 'User Management Page',
                        description: 'Dito mo makikita at pamamahalaan ang lahat ng registered users sa system.',
                        side: 'bottom',
                        align: 'start',
                    }
                },
                {
                    element: '#search-input',
                    popover: {
                        title: 'Search Users',
                        description: 'Mag-type ng pangalan o email para mabilis na mahanap ang user.',
                        side: 'bottom',
                        align: 'start',
                    }
                },
                {
                    element: '#role-filter',
                    popover: {
                        title: 'Filter by Role',
                        description: 'I-filter ang listahan ng users batay sa kanilang role (e.g., Admin, Resident).',
                        side: 'bottom',
                        align: 'end',
                    }
                },
                {
                    element: '#users-table-thead',
                    popover: {
                        title: 'Sortable Columns',
                        description: 'I-click ang mga column headers (Name, Email, Registered On) para i-sort ang listahan.',
                        side: 'bottom',
                        align: 'start',
                    }
                },
                {
                    element: roleSelectorId,
                    popover: {
                        title: 'Change User Role',
                        description: 'Piliin ang bagong role para sa isang user. Awtomatikong mag-a-update ang role pagkatapos mong pumili.',
                        side: 'left',
                        align: 'start',
                    }
                },
                {
                    element: '#pagination-controls',
                    popover: {
                        title: 'Pagination',
                        description: 'Gamitin ang mga controls na ito para mag-navigate sa iba pang pages ng user list.',
                        side: 'top',
                        align: 'end',
                    }
                },
            ],
            // Customizations for a better user experience
            popoverClass: 'custom-driver-popover',
            onDestroyed: () => {
                // Optional: Code to run after the tour ends
            }
        });

        // Only start the tour if a target user and element were found
        if (roleSelectorId) {
             driverObj.drive();
        } else {
            toast.error("User tour cannot start. No user roles to demonstrate.");
        }
    };

    // Handle role change with Inertia.js patch request
    const handleRoleChange = (e, user) => {
        const newRole = e.target.value;
        if (user.id === auth.user.id && newRole !== user.role) {
            toast.error("You cannot change your own role from 'super_admin'.");
            return;
        }

        setUpdatingUser(user.id);
        router.patch(route('superadmin.users.updateRole', { user: user.id }), {
            role: newRole,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setLocalUsers(prevUsers =>
                    prevUsers.map(u =>
                        u.id === user.id ? { ...u, role: newRole } : u
                    )
                );
                toast.success(`Role updated to ${newRole} for ${user.full_name}.`);
                setUpdatingUser(null);
            },
            onError: () => {
                toast.error('Failed to update user role. Please try again.');
                setUpdatingUser(null);
            }
        });
    };

    // Handle sorting
    const handleSort = (column) => {
        let sortOrder = 'asc';
        if (params.sortBy === column && params.sortOrder === 'asc') {
            sortOrder = 'desc';
        }
        
        const newParams = { ...params, sortBy: column, sortOrder: sortOrder, page: 1 };
        setParams(newParams);
        
        router.get(route('superadmin.users.index'), newParams, {
            preserveState: true,
            replace: true,
        });
    };

    // Handle filtering and searching
    const handleFilterChange = (key, value) => {
        const newParams = { ...params, [key]: value, page: 1 };
        setParams(newParams);

        router.get(route('superadmin.users.index'), newParams, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="User Management" />

            <div className="py-12 bg-gray-50 min-h-screen font-sans antialiased">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200">
                        {/* Header Section */}
                        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <div id="page-title">
                                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Manage Users
                                </h3>
                                <p className="mt-1 text-gray-500 max-w-2xl text-sm">
                                    View and manage all registered accounts, roles, and user details.
                                </p>
                            </div>
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <input
                                        id="search-input"
                                        type="text"
                                        placeholder="Search by name or email"
                                        value={params.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 pl-10 pr-4 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                                    />
                                </div>
                                <select
                                    id="role-filter"
                                    value={params.role}
                                    onChange={(e) => handleFilterChange('role', e.target.value)}
                                    className="block w-40 rounded-md border-gray-300 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="resident">Resident</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                                <button
                                    onClick={startTour}
                                    className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    aria-label="Start tour"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L7 9.167A1 1 0 007 10.833L9.133 13.5a1 1 0 001.734 0L13 10.833A1 1 0 0013 9.167L10.867 6.5A1 1 0 0010 7z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* User Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-sky-50 border-b border-blue-200" id="users-table-thead">
                                    <tr>
                                        <th scope="col" onClick={() => handleSort('full_name')} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-sky-100 transition duration-200">
                                            <div className="flex items-center space-x-1">
                                                <span>Name</span>
                                                {params.sortBy === 'full_name' && (
                                                    <span>{params.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" onClick={() => handleSort('email')} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-sky-100 transition duration-200">
                                            <div className="flex items-center space-x-1">
                                                <span>Email</span>
                                                {params.sortBy === 'email' && (
                                                    <span>{params.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                                        <th scope="col" onClick={() => handleSort('created_at')} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-sky-100 transition duration-200">
                                            <div className="flex items-center space-x-1">
                                                <span>Registered On</span>
                                                {params.sortBy === 'created_at' && (
                                                    <span>{params.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {localUsers.length > 0 ? (
                                        localUsers.map((user, index) => (
                                            <tr 
                                                key={user.id} 
                                                className={`transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${user.id === auth.user.id ? 'border-l-4 border-blue-500' : ''} hover:bg-blue-100`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.full_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {updatingUser === user.id ? (
                                                        <LoadingSpinner />
                                                    ) : (
                                                        <select
                                                            id={`user-role-selector-${user.id}`} // Unique ID for each select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(e, user)}
                                                            className={`block w-auto rounded-md px-3 py-1 text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${roleBadgeClasses[user.role]} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
                                                            disabled={user.id === auth.user.id && user.role === 'super_admin'}
                                                        >
                                                            <option value="resident">Resident</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="super_admin">Super Admin</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-lg">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p>Walang user na nakita.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination links */}
                        {initialUsers.links && (
                            <div className="p-6 flex justify-between items-center text-sm text-gray-600 border-t border-gray-200" id="pagination-controls">
                                <div>
                                    Showing <span className="font-bold">{initialUsers.from}</span> to <span className="font-bold">{initialUsers.to}</span> of <span className="font-bold">{initialUsers.total}</span> results
                                </div>
                                <div className="flex space-x-1">
                                    {initialUsers.links.map((link, index) => (
                                        <a
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-1 rounded-md transition duration-200 ${link.active ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-200'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
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