import React, { useState } from 'react';

const TestimonialCard = () => {
  return (
    <div className="bg-white rounded-lg p-6 max-w-md relative">
      <div className="flex items-center mb-4">
        <img
          src="/api/placeholder/40/40"
          alt="User profile"
          className="w-10 h-10 rounded-full mr-4"
        />
        <div>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">NOVA YORK</span>
            <span className="text-gray-600">4.0</span>
            <div className="flex ml-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-gray-700 italic mb-4">
        "Lorem ipsum dolor sit amet consectetur. Aliquet malesuada tellus viverra ultrices egestas socia gravida sem. Enim elit massa ullamcorper erat."
      </p>
      <div className="mt-4">
        <p className="font-semibold text-gray-800">Mike taylor</p>
        <p className="text-gray-600 text-sm">Lahore, Pakistan</p>
      </div>
    </div>
  );
};

const About = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="bg-gray-900 py-16">
      <div className="container mx-12 px-4">
        {/* Discovery Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <div className="space-y-6">
            <h2 className="text-white text-4xl font-bold">
              Discover More About
              <br />
              Rental Hostels
            </h2>
            <div className="w-20 h-1 bg-orange-500"></div>
            <p className="text-gray-400">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
              praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
              excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia
              deserunt mollitia animi, id est laborum et dolorum fuga.
            </p>
            <div className="flex gap-4">
              <button className="bg-transparent border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-gray-900 transition">
                Ask A Question
              </button>
              <button className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition">
                Discover More
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://imgs.search.brave.com/hcUp10quymMip8hJvVGhfSfnkzOAn0V5ow_ojdBe-NI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA4LzUwLzAzLzIx/LzM2MF9GXzg1MDAz/MjE2Ml9scHJCc0xP/bXNSTDJOUFB3TG1m/bGNjTkpjbGtjYktF/OC5qcGc"
              alt="Hostel room"
              className="w-[40rem] h-full object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <TestimonialCard />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    activeSlide === index ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center mb-6">
              <span className="text-orange-500 text-[18rem] font-serif">“</span>
              <h2 className="text-white text-6xl font-bold ml-4">
                What People Say
                <br />
                About Us.
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;