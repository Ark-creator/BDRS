import React from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'react-toastify';

// Reusable Input component for styling consistency
const Input = ({ label, name, value, onChange, error, ...props }) => (
    <div className="col-span-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <input
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${error ? 'border-red-500' : ''}`}
            {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

// Reusable Select component for the dropdown
const Select = ({ label, name, value, onChange, error, children }) => (
    <div className="col-span-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <select
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${error ? 'border-red-500' : ''}`}
        >
            {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);


export default function EditUserModal({ user, isOpen, onClose }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        email: user.email,
        profile: {
            first_name: user.profile?.first_name || '',
            middle_name: user.profile?.middle_name || '',
            last_name: user.profile?.last_name || '',
            phone_number: user.profile?.phone_number || '',
            address: user.profile?.address || '',
            civil_status: user.profile?.civil_status || '',
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('superadmin.users.update', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User updated successfully!');
                onClose();
            },
            onError: () => {
                toast.error('Please check the form for errors.');
            }
        });
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-semibold text-gray-900">Edit User: {user.full_name}</h3>
                        <p className="text-sm text-gray-500">Update the user's personal details and email.</p>
                    </div>

                    <div className="p-6 grid grid-cols-2 gap-6">
                        {/* Form Fields */}
                        <Input label="First Name" name="profile.first_name" value={data.profile.first_name} onChange={e => setData('profile', { ...data.profile, first_name: e.target.value })} error={errors['profile.first_name']} required />
                        <Input label="Last Name" name="profile.last_name" value={data.profile.last_name} onChange={e => setData('profile', { ...data.profile, last_name: e.target.value })} error={errors['profile.last_name']} required />
                        <Input label="Middle Name" name="profile.middle_name" value={data.profile.middle_name} onChange={e => setData('profile', { ...data.profile, middle_name: e.target.value })} error={errors['profile.middle_name']} />
                        <Input label="Email Address" name="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} required />
                        <Input label="Phone Number" name="profile.phone_number" value={data.profile.phone_number} onChange={e => setData('profile', { ...data.profile, phone_number: e.target.value })} error={errors['profile.phone_number']} />

                        <Select
                            label="Civil Status"
                            name="profile.civil_status"
                            value={data.profile.civil_status}
                            onChange={e => setData('profile', { ...data.profile, civil_status: e.target.value })}
                            error={errors['profile.civil_status']}
                        >
                            <option value="">Select a status...</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                        </Select>

                        <div className="col-span-2">
                             <Input label="Address" name="profile.address" value={data.profile.address} onChange={e => setData('profile', { ...data.profile, address: e.target.value })} error={errors['profile.address']} />
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end items-center space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}