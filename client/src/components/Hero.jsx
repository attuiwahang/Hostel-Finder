import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-black"
        ></motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          {/* Main Text */}
          <div className="max-w-3xl mx-20 text-white space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl font-bold mb-4"
            >
              We Are Here,
            </motion.h1>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl font-semibold text-orange-400 mb-8"
            >
              To Help You Find Your Place.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg mb-12"
            >
              We love to help you find your place according to your need. Just join us now to find 
              more about us. We have listed the best of the best hostels all around the world. Choose 
              your place.
            </motion.p>

            {/* Search Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-8"
            >
              <h3 className="text-2xl font-semibold mb-4">FIND</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex-1"
                >
                  <input
                    type="text"
                    placeholder="Which city do you prefer?"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex-1"
                >
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </motion.div>
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: '#f97316' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-orange-400 text-white px-8 py-3 rounded-lg transition-colors duration-200"
                >
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
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;