import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router } from "@inertiajs/react";

export default function Messages() {
  const { messages, subjects, currentSubject } = usePage().props;

  const handleFilterClick = (subject) => {
    router.get(route('admin.messages', { subject: subject }));
  };

  const handleMarkAsRead = (message) => {
    if (message.status === 'unread') {
      router.patch(route('admin.messages.updateStatus', message.id));
    }
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Messages</h2>}
    >
      <Head title="Messages" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              <h3 className="text-lg font-bold mb-4">Message Inbox</h3>
              
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-6">
                {subjects.map((subject) => (
                  <button 
                    key={subject}
                    onClick={() => handleFilterClick(subject)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors
                      ${currentSubject === subject 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`
                    }
                  >
                    {subject}
                  </button>
                ))}
                {currentSubject && (
                  <button onClick={() => handleFilterClick('')} className="px-4 py-2 text-sm font-semibold rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                    Show All
                  </button>
                )}
              </div>

              {/* Messages Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <tr key={message.id} className={message.status === 'unread' ? 'bg-yellow-50' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {message.user?.full_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {message.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.status === 'unread' && (
                              <button
                                onClick={() => handleMarkAsRead(message)}
                                className="text-blue-600 hover:text-blue-900 font-semibold"
                              >
                                Mark as Read
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No messages found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}