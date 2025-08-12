import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, router, useForm } from "@inertiajs/react";

export default function Messages() {
  const { messages, subjects, currentSubject } = usePage().props;
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    reply_message: '',
  });

  const handleFilterClick = (subject) => {
    router.get(route('admin.messages', { subject: subject }));
  };

  const handleMarkAsRead = (message) => {
    if (message.status === 'unread') {
      router.patch(route('admin.messages.updateStatus', message.id));
    }
  };

  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      handleMarkAsRead(message);
    }
  };
  
  const handleCloseMessage = () => {
    setSelectedMessage(null);
    reset();
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (selectedMessage) {
      post(route('admin.messages.storeReply', selectedMessage.id), {
        onSuccess: () => {
          setSelectedMessage(null);
          reset();
        },
      });
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
                        <tr
                          key={message.id}
                          className={`cursor-pointer ${message.status === 'unread' ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-white hover:bg-gray-100'}`}
                          onClick={() => handleOpenMessage(message)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {message.user?.full_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                            {message.message}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                            {message.status === 'unread' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(message); }}
                                className="text-blue-600 hover:text-blue-900 font-semibold"
                                title="Mark as Read"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenMessage(message); }}
                              className="text-gray-600 hover:text-gray-900 font-semibold"
                              title="View and Reply"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-1.5 0a3 3 0 106 0 3 3 0 00-6 0zm10.5-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-1.5 0a3 3 0 106 0 3 3 0 00-6 0z" clipRule="evenodd" />
                              </svg>
                            </button>
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
      
      {/* The Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={handleCloseMessage}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Message from {selectedMessage.user?.full_name}</h3>
              <button onClick={handleCloseMessage} className="text-gray-500 hover:text-gray-900 text-2xl font-bold leading-none">&times;</button>
            </div>
            
            <p className="mb-2"><span className="font-semibold">Subject:</span> {selectedMessage.subject}</p>
            <p className="mb-4"><span className="font-semibold">Message:</span> {selectedMessage.message}</p>
            <p className="text-sm text-gray-500 mb-4">Received at: {new Date(selectedMessage.created_at).toLocaleString()}</p>
            
            {/* Display existing replies */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-md mb-2">Replies:</h4>
                {selectedMessage.replies.map((reply) => (
                  <div key={reply.id} className="bg-gray-100 p-3 rounded-md mb-2">
                    <p className="text-sm">
                      <span className="font-semibold">{reply.user?.full_name || 'Admin'} replied:</span> {reply.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(reply.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleReply} className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-md mb-2">Reply to this message</h4>
              <textarea
                value={data.reply_message}
                onChange={(e) => setData('reply_message', e.target.value)}
                className="w-full p-2 border rounded-md"
                rows="4"
                placeholder="Write your reply here..."
              ></textarea>
              {errors.reply_message && <div className="text-red-500 text-sm mt-1">{errors.reply_message}</div>}
              <button type="submit" disabled={processing} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Send Reply
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}