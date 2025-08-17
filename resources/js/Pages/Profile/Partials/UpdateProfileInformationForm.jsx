import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            first_name: user.profile?.first_name || '',
            middle_name: user.profile?.middle_name || '',
            last_name: user.profile?.last_name || '',
            email: user.email || '',
            phone_number: user.profile?.phone_number || '',
            address: user.profile?.address || '',
            birthday: user.profile?.birthday ? new Date(user.profile.birthday).toISOString().split('T')[0] : '',
            gender: user.profile?.gender || '',
            civil_status: user.profile?.civil_status || '',
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };
    
    // Reusable tooltip component
    const NotEditableTooltip = () => (
        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
            This field is not editable
            <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-gray-900"></div>
        </div>
    );

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profile Information
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <InputLabel htmlFor="first_name" value="First Name" />
                        <TextInput id="first_name" className="mt-1 block w-full" value={data.first_name} disabled />
                        <InputError className="mt-2" message={errors.first_name} />
                        <NotEditableTooltip />
                    </div>
                    <div className="relative group">
                        <InputLabel htmlFor="middle_name" value="Middle Name" />
                        <TextInput id="middle_name" className="mt-1 block w-full" value={data.middle_name} disabled />
                        <InputError className="mt-2" message={errors.middle_name} />
                        <NotEditableTooltip />
                    </div>
                    <div className="relative group">
                        <InputLabel htmlFor="last_name" value="Last Name" />
                        <TextInput id="last_name" className="mt-1 block w-full" value={data.last_name} disabled />
                        <InputError className="mt-2" message={errors.last_name} />
                        <NotEditableTooltip />
                    </div>
                </div>

                {/* Contact Fields (Editable) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoComplete="username" />
                        <InputError className="mt-2" message={errors.email} />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone_number" value="Phone Number" />
                        <TextInput id="phone_number" type="text" className="mt-1 block w-full" value={data.phone_number} onChange={(e) => setData('phone_number', e.target.value)} />
                        <InputError message={errors.phone_number} className="mt-2" />
                    </div>
                </div>
                
                {/* Other Info Fields (Not Editable) */}
                <div className="relative group">
                    <InputLabel htmlFor="address" value="Address" />
                    <TextInput id="address" className="mt-1 block w-full" value={data.address} disabled />
                    <InputError className="mt-2" message={errors.address} />
                    <NotEditableTooltip />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <InputLabel htmlFor="birthday" value="Birthday" />
                        <TextInput id="birthday" type="date" className="mt-1 block w-full" value={data.birthday} disabled />
                        <InputError className="mt-2" message={errors.birthday} />
                        <NotEditableTooltip />
                    </div>
                    <div className="relative group">
                        <InputLabel htmlFor="gender" value="Gender" />
                        <select id="gender" className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm" value={data.gender} disabled>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <InputError className="mt-2" message={errors.gender} />
                        <NotEditableTooltip />
                    </div>
                     <div className="relative group">
                        <InputLabel htmlFor="civil_status" value="Civil Status" />
                        <select 
                            id="civil_status" 
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm" 
                            value={data.civil_status} 
                            
                        >
                            <option value="">Select Status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                        </select>
                        <InputError className="mt-2" message={errors.civil_status} />
                        {/* <NotEditableTooltip /> */}
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}