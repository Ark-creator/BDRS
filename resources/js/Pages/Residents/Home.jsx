import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Home({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Home</h2>}
        >
            <Head title="Home" />

<div class="max-w-7xl mx-auto mt-10 overflow-hidden rounded-lg">
  <div class="flex bg-gray-600 text-white">

    <div class="w-1/3 bg-gray-800"></div>


    <div class="w-2/3 px-10 py-10 flex flex-col justify-between relative">
      <div> 
        <p class="text-sm text-gray-400 mb-2">Announcements</p>
        <h2 class="text-2xl font-semibold leading-snug mb-4">
          Lorem ipsum dolor sit amet, consectetur
        </h2>
        <a href="#" class="text-sm underline hover:text-gray-300">Read More</a>
      </div>

      <div class="flex items-center justify-between mt-10">

        <div class="space-x-2">
          <span class="w-2 h-2 bg-white rounded-full inline-block"></span>
          <span class="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
          <span class="w-2 h-2 bg-gray-500 rounded-full inline-block"></span>
        </div>

        <button class="text-white hover:text-gray-300 transition">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>

  </div>
</div>

 <div className="py-20 bg-gray-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white flex  gap-10 justify-center">

    {/* STEP 1 */}
    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[600px] flex justify-between items-center hover:scale-[1.02]">
      <div className="text-left">
        <div className="text-2xl font-semibold mb-2 tracking-wide">Step #1</div>
        <p className="text-lg text-gray-300">
          Click the <span className="text-white font-medium">"Request Now"</span> button to start.
        </p>
      </div>
      <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
        <i className="fa-solid fa-arrow-pointer fa-2xl"></i>
      </div>
    </div>

    {/* STEP 2 */}
    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[600px] flex justify-between items-center hover:scale-[1.02]">
      <div className="text-left">
        <div className="text-2xl font-semibold mb-2 tracking-wide">Step #2</div>
        <p className="text-lg text-gray-300">
          Select a document type and fill out the request form carefully.
        </p>
      </div>
      <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
        <i className="fa-solid fa-pen-to-square fa-2xl"></i>
      </div>
    </div>

    {/* STEP 3 */}
    <div className="bg-gray-800 hover:bg-gray-700 transition duration-300 shadow-lg rounded-xl p-8 w-full md:w-[600px] flex justify-between items-center hover:scale-[1.02]">
      <div className="text-left">
        <div className="text-2xl font-semibold mb-2 tracking-wide">Step #3</div>
        <p className="text-lg text-gray-300">
          You'll be notified via email or SMS once your documents are ready for pickup.
        </p>
      </div>
      <div className="bg-gray-700 text-white rounded-full p-5 ml-6">
        <i className="fa-solid fa-clock fa-2xl"></i>
      </div>
    </div>

  </div>
  {/* Button */}
  <div className="mt-10 text-center">
    <button className="bg-gray-800 hover:bg-gray-600 transition text-white font-bold px-8 py-4 rounded-md shadow-md hover:scale-105 duration-300">
      REQUEST NOW &gt;
    </button>
  </div>
</div>

        </AuthenticatedLayout>
    );
}