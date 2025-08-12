import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-900">

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          <div className="lg:col-span-1">
            <div className="flex items-center gap-4">

              <img 
                  className="h-16 w-16 rounded-full" 
                  src="/images/logo1.jpg"
                  alt="Official Seal of the Barangay" 
              />
              <div>
                  <h2 className="text-lg font-bold text-white">Brgy. San Lorenzo</h2>
                  <p className="text-sm text-blue-200">Gapan City, Nueva Ecija</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Contact Details</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                 <p className="text-base text-blue-200">Brgy. Hall, San Lorenzo, Gapan City, 3105</p>
              </li>
              <li className="flex items-start">
                <a href="mailto:contact@sanlorenzo.gov.ph" className="text-base text-blue-200 hover:text-white transition-colors">contact@sanlorenzo.gov.ph</a>
              </li>
              <li className="flex items-start">
                <a href="tel:+63441234567" className="text-base text-blue-200 hover:text-white transition-colors">(044) 329-6240</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-400 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-base text-blue-200 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-blue-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-blue-300">&copy; {new Date().getFullYear()} Barangay San Lorenzo, Gapan City. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-blue-300 hover:text-white transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;