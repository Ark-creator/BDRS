import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Announcement({ auth, announcements = [] }) {
    // useForm hook for creating a new announcement
    const { data, setData, post, processing, errors, reset } = useForm({
        tag: '',
        title: '',
        description: '',
        link: '',
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        // CORRECTED ROUTE NAME
        post(route('admin.announcements.store'), {
            onSuccess: () => reset(), // Reset form fields on success
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manage Announcements</h2>}
        >
            <Head title="Announcements" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* FORM FOR CREATING ANNOUNCEMENTS */}
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Create New Announcement</h3>
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="tag" value="Tag (e.g., Community Event)" />
                                <TextInput id="tag" name="tag" value={data.tag} className="mt-1 block w-full" onChange={(e) => setData('tag', e.target.value)} required />
                                <InputError message={errors.tag} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="title" value="Title" />
                                <TextInput id="title" name="title" value={data.title} className="mt-1 block w-full" onChange={(e) => setData('title', e.target.value)} required />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value="Description" />
                                <textarea id="description" name="description" value={data.description} className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm" onChange={(e) => setData('description', e.target.value)} required rows="4"></textarea>
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                            
                            <div>
                                <InputLabel htmlFor="link" value="Read More Link (Optional)" />
                                <TextInput id="link" name="link" type="url" value={data.link} className="mt-1 block w-full" onChange={(e) => setData('link', e.target.value)} placeholder="https://example.com/news" />
                                <InputError message={errors.link} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="image" value="Image" />
                                <input type="file" id="image" name="image" className="mt-1 block w-full text-gray-900 dark:text-gray-100" onChange={(e) => setData('image', e.target.files[0])} required />
                                <InputError message={errors.image} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Create</PrimaryButton>
                                {processing && <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>}
                            </div>
                        </form>
                    </div>

                    {/* TABLE OF EXISTING ANNOUNCEMENTS */}
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                         <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Existing Announcements</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Posted By</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {announcements.map((announcement) => (
                                        <tr key={announcement.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{announcement.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {announcement.user?.profile?.first_name 
                                                    ? `${announcement.user.profile.first_name} ${announcement.user.profile.last_name}`
                                                    : announcement.user?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link 
                                                    // CORRECTED ROUTE NAME
                                                    href={route('admin.announcements.destroy', announcement.id)} 
                                                    method="delete" 
                                                    as="button"
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={(e) => !confirm('Are you sure you want to delete this announcement?') && e.preventDefault()}
                                                >
                                                    Delete
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}