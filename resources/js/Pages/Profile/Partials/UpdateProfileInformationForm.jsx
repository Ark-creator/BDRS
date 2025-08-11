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
        })


    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
        <InputLabel htmlFor="first_name" value="First Name" />
        <TextInput
            id="first_name"
            className="mt-1 block w-full"
            value={data.first_name}
            onChange={(e) => setData('first_name', e.target.value)}
            required
            isFocused
            autoComplete="given-name"
        />
        <InputError className="mt-2" message={errors.first_name} />
    </div>

    <div>
        <InputLabel htmlFor="middle_name" value="Middle Name" />
        <TextInput
            id="middle_name"
            className="mt-1 block w-full"
            value={data.middle_name}
            onChange={(e) => setData('middle_name', e.target.value)}
            autoComplete="additional-name"
        />
        <InputError className="mt-2" message={errors.middle_name} />
    </div>

    <div>
        <InputLabel htmlFor="last_name" value="Last Name" />
        <TextInput
            id="last_name"
            className="mt-1 block w-full"
            value={data.last_name}
            onChange={(e) => setData('last_name', e.target.value)}
            required
            autoComplete="family-name"
        />
        <InputError className="mt-2" message={errors.last_name} />
    </div>
    
</div>


                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>
                <div className="mt-4">
                    <InputLabel htmlFor="phone_number" value="Phone Number" />

                    <TextInput
                        id="phone_number"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                    />

                    <InputError message={errors.phone_number} className="mt-2" />
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

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
