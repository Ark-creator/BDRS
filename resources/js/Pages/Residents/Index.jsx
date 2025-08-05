// resources/js/Pages/Residents/Index.jsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
// You can import and use your Header component here if you wish
// import HeaderComponent from '@/Components/Residents/Header'; 

export default function Index({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Residents</h2>}
        >
            <Head title="Residents" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            This is the Residents page!
                            {/* You could place your <HeaderComponent /> here */}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}