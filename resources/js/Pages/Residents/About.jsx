import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function About({ auth }) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          About Us
        </h2>
      }
    >
      <Head title="About Us" />

      {/* ANNOUNCEMENTS BANNER */}
      <div className="max-w-7xl mx-auto mt-10 overflow-hidden rounded-lg">
        <div className="flex bg-gray-600 text-white">
          <div className="w-1/3 bg-gray-800"></div>
          <div className="w-2/3 px-10 py-10 flex flex-col justify-between relative">
            <div>
              <p className="text-sm text-gray-400 mb-2">Announcements</p>
              <h2 className="text-2xl font-semibold leading-snug mb-4">
                Lorem ipsum dolor sit amet, consectetur
              </h2>
              <a href="#" className="text-sm underline hover:text-gray-300">
                Read More
              </a>
            </div>
            <div className="flex items-center justify-between mt-10">
              <div className="space-x-2">
                <span className="w-2 h-2 bg-white rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
              </div>
              <button className="text-white hover:text-gray-300 transition">
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MISSION & VISION */}
      <div className="max-w-7xl mx-auto mt-20 px-6 text-white animate-fade-in">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-gray-300 leading-relaxed">
              To provide fast, transparent, and accessible services to every citizen, leveraging digital solutions to make document processing easy and efficient.
            </p>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-gray-300 leading-relaxed">
              A modern and inclusive local government where services are delivered with integrity, innovation, and impact.
            </p>
          </div>
        </div>
      </div>
      {/* TIMELINE */}
      <div className="max-w-5xl mx-auto mt-24 px-6 text-white">
        <h2 className="text-3xl font-bold mb-10 text-center">Our Journey</h2>
        <ol className="relative border-l border-gray-700">
          {[
            { year: '2023', event: 'System Development Started' },
            { year: '2024', event: 'Beta Version Released' },
            { year: '2025', event: 'Fully Launched for Public Use' },
            { year: '2026', event: 'Integrated with Local Government' },
          ].map((item, index) => (
            <li key={index} className="mb-10 ml-6">
              <span className="absolute w-4 h-4 bg-blue-500 rounded-full -left-2.5 border border-white"></span>
              <h3 className="text-lg font-semibold">{item.year}</h3>
              <p className="text-gray-400">{item.event}</p>
            </li>
          ))}
        </ol>
      </div>


      {/* CORE VALUES */}
      <div className="max-w-7xl mx-auto mt-24 px-6 text-white">
        <h2 className="text-3xl font-bold mb-10 text-center ">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Transparency', icon: 'fa-eye' },
            { title: 'Efficiency', icon: 'fa-bolt' },
            { title: 'Accessibility', icon: 'fa-universal-access' },
          ].map((value) => (
            <div
              key={value.title}
              className="bg-gray-800 p-6 rounded-lg text-center hover:bg-gray-700 transition duration-300 shadow-lg mb-8"
            >
              <div className="mb-4 text-3xl">
                <i className={`fa-solid ${value.icon}`}></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-gray-300">We uphold {value.title.toLowerCase()} in every service we provide.</p>
            </div>
          ))}
        </div>
      </div>



    </AuthenticatedLayout>
  );
}
