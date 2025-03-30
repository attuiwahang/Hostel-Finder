import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TestimonialCard = ({ isActive }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        y: isActive ? 0 : 10,
        scale: isActive ? 1 : 0.95
      }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg p-6 max-w-md relative"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center mb-4"
      >
        <img
          src="/api/placeholder/40/40"
          alt="User profile"
          className="w-10 h-10 rounded-full mr-4"
        />
        <div>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">NOVA YORK</span>
            <span className="text-gray-600">4.0</span>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex ml-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.svg
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + (i * 0.1), duration: 0.3 }}
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-gray-700 italic mb-4"
      >
        "Lorem ipsum dolor sit amet consectetur. Aliquet malesuada tellus viverra ultrices egestas socia gravida sem. Enim elit massa ullamcorper erat."
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-4"
      >
        <p className="font-semibold text-gray-800">Mike taylor</p>
        <p className="text-gray-600 text-sm">Lahore, Pakistan</p>
      </motion.div>
    </motion.div>
  );
};

const About = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const testimonials = [
    {
      name: "Mike Taylor",
      location: "Lahore, Pakistan",
      text: "Lorem ipsum dolor sit amet consectetur. Aliquet malesuada tellus viverra ultrices egestas socia gravida sem. Enim elit massa ullamcorper erat."
    },
    {
      name: "Sarah Johnson",
      location: "London, UK",
      text: "Amazing service and beautiful hostels. The staff was incredibly helpful and made my stay memorable. I would definitely recommend this to anyone traveling on a budget."
    },
    {
      name: "David Chen",
      location: "Toronto, Canada",
      text: "Clean facilities, great location, and wonderful community atmosphere. I've made friends from all over the world. This is my go-to choice whenever I travel now."
    }
  ];

  return (
    <div className="bg-gray-900 py-16">
      <div className="container mx-12 px-4">
        {/* Discovery Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24"
        >
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-white text-4xl font-bold"
            >
              Discover More About
              <br />
              Rental Hostels
            </motion.h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "5rem" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="h-1 bg-orange-500"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-gray-400"
            >
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
              praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
              excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia
              deserunt mollitia animi, id est laborum et dolorum fuga.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,1)", color: "#111827" }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border border-white text-white px-6 py-2 rounded transition"
              >
                Ask A Question
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-500 text-white px-6 py-2 rounded transition"
              >
                Discover More
              </motion.button>
            </motion.div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <motion.img
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              src="https://imgs.search.brave.com/hcUp10quymMip8hJvVGhfSfnkzOAn0V5ow_ojdBe-NI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA4LzUwLzAzLzIx/LzM2MF9GXzg1MDAz/MjE2Ml9scHJCc0xP/bXNSTDJOUFB3TG1m/bGNjTkpjbGtjYktF/OC5qcGc"
              alt="Hostel room"
              className="w-[40rem] h-full object-cover rounded-lg shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div className="relative">
            <TestimonialCard isActive={true} />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
            >
              {[0, 1, 2].map((index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-2 h-2 rounded-full ${
                    activeSlide === index ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-orange-500 text-[18rem] font-serif"
              >
                "
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-white text-6xl font-bold ml-4"
              >
                What People Say
                <br />
                About Us.
              </motion.h2>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;