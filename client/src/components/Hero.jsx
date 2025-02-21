import React from 'react';
import hero from '../assets/hero.png';

const Hero = () => {
  return (
    <div className="relative min-h-screen -z-10">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen ">
        <div className="container mx-auto px-4 py-16">
          {/* Main Text */}
          <div className="max-w-3xl mx-20 text-white space-y-8">
            <h1 className="text-5xl font-bold mb-4">We Are Here,</h1>
            <h2 className="text-4xl font-semibold text-orange-400 mb-8">
              To Help You Find Your Place.
            </h2>
            <p className="text-lg mb-12">
              We love to help you find your place according to your need. Just join us now to find 
              more about us. We have listed the best of the best hostels all around the world. Choose 
              your place.
            </p>

            {/* Search Section */}
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4">FIND</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Which city do you prefer?"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <button className="bg-orange-400 text-white px-8 py-3 rounded-lg hover:bg-orange-500 transition-colors duration-200">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
