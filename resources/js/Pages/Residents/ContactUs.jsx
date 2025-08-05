import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function ContactUs({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Contact Us</h2>}
        >
            <Head title="Contact Us" />

<div className="max-w-7xl mx-auto py-16 px-6">
  {/* Header */}
  <div className="text-center mb-16">
    <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">Contact Us</h1>
    <p className="text-gray-500 dark:text-gray-300 mt-4 text-lg max-w-xl mx-auto">
     Any question or remarks? Just write us a message!
    </p>
  </div>

  {/* Main Card */}
  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
    {/* Left Panel */}
    <div className="bg-black text-white p-10 md:p-14 relative flex flex-col justify-between">
      <div>
        {/* Map */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-lg border border-gray-800">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d240.5109480357198!2d120.95325528982741!3d15.31271275468395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339721a57fb8c8d5%3A0x1af3c845bca15d8f!2sSan%20Lorenzo%20Barangay%20Hall!5e0!3m2!1sen!2sph!4v1754392513439!5m2!1sen!2sph"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <div className="space-y-6 text-base">
          <div className="flex items-center gap-4">
            <i className="fa-solid fa-phone text-lg text-white"></i>
            <span>+63 123 456 789</span>
          </div>
          <div className="flex items-center gap-4">
            <i className="fa-solid fa-envelope text-lg text-white"></i>
            <span>barangay@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <i className="fa-solid fa-location-dot text-lg text-white"></i>
            <span>San Lorenzo Street, Barangay Hall</span>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-2">Operating Hours</h4>
          <p className="text-sm text-gray-400">Mon - Fri: 8:00 AM – 5:00 PM</p>
          <p className="text-sm text-gray-400">Sat - Sun: Closed</p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 opacity-10">
        <div className="w-32 h-32 bg-white rounded-full mix-blend-overlay"></div>
        
      </div>
           <div className="absolute bottom-2 right-2 opacity-10">
        <div className="w-32 h-32 bg-white rounded-full mix-blend-overlay"></div>
        
      </div>
    </div>


    <div className="p-10 md:p-14 bg-gray-100 dark:bg-gray-800">
      <form className="flex flex-col gap-8">

        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-3">Select Subject</label>
          <div className="flex flex-wrap gap-4">
            {['General Inquiry', 'Feedback', 'Support', 'Complaint'].map((label, i) => (
              <label key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                <input type="radio" name="subject" className="accent-black dark:accent-white" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

   

        {/* Message */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-3">Message</label>
          <textarea
            rows="4"
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            placeholder="Write your message..."
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-black dark:bg-white text-white dark:text-black font-medium px-6 py-3 rounded-md shadow hover:scale-105 hover:opacity-90 transition duration-200"
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  </div>
</div>


        </AuthenticatedLayout>
    );
}