import React from 'react';
import { Link } from '@inertiajs/react';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">BDRS Admin</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href={route('admin.dashboard')} className="text-gray-700 hover:text-blue-600 px-3 py-2">
                Dashboard
              </Link>
              <Link href={route('admin.requests.index')} className="text-gray-700 hover:text-blue-600 px-3 py-2">
                Requests
              </Link>
              <Link href={route('admin.announcements.index')} className="text-gray-700 hover:text-blue-600 px-3 py-2">
                Announcements
              </Link>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (confirm('Are you sure you want to log out?')) {
                    route().delete(route('logout'));
                  }
                }}
                className="inline"
              >
                <button type="submit" className="text-red-600 hover:text-red-800 px-3 py-2">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;