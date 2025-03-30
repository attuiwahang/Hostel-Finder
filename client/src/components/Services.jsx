import React from 'react';
import { motion } from 'framer-motion';
import onlineBooking from '../assets/Online booking.png';

const BookingCard = ({ delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true, margin: "-100px" }}
    whileHover={{ y: -10 }}
    className="flex flex-col items-center"
  >
    <motion.div 
      whileHover={{ scale: 1.1, backgroundColor: '#a5f3fc' }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center mb-2"
    >
      <img src={onlineBooking} alt="Online Booking" />
    </motion.div>
    <h3 className="text-white text-sm font-medium">Online Booking</h3>
    <p className="text-gray-400 text-xs text-center mt-1">Book your hostel online on your choice.</p>
  </motion.div>
);

const Services = () => {
  // Variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Services Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mb-16"
      >
        <motion.h2 
          variants={itemVariants}
          className="text-white text-3xl font-bold text-center mb-12"
        >
          We Offer Best Services
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <BookingCard delay={0.2} />
          <BookingCard delay={0.4} />
          <BookingCard delay={0.6} />
          <BookingCard delay={0.8} />
        </div>
      </motion.div>

      {/* Where Every Stay Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="gap-12 mb-32"
      >
        <div className="space-y-6 flex justify-around items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1 }}
            className="inline-block bg-gray-800 p-2"
          >
            <div className='flex flex-col items-center'>
              <span className='text-white text-[0.8rem]'>Years of Experience</span>
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-white text-4xl font-bold"
              >
                10
              </motion.span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-white text-5xl font-bold">
              Where Every Stay<br />
              Feels Like<br />
              <motion.span 
                initial={{ color: "#fff" }}
                whileInView={{ color: "#f97316" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-orange-500"
              >
                Home
              </motion.span>
            </h2>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='flex flex-col w-96'
          >
            <p className="text-gray-400">
              Lorem ipsum dolor sit amet consectetur. Aliquam vel vitae tellus nunc. 
              Curabitur pulvinar nisi tellus non varius.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-500 text-white px-6 py-2 rounded mt-4"
            >
              View About Us
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Affordable Comfort Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-rows-2 gap-4"
        >
          <motion.img 
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
            src="https://imgs.search.brave.com/Fe6dSUusYG0oGtmWuWLR3uVs_m5aOAMY9szecv4dAkw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA5LzM3LzY4Lzg2/LzM2MF9GXzkzNzY4/ODY0NV9jcjBydXVu/UWhER2RUVkZyTkNp/WWVmNkpxcGVPeWR1/OC5qcGc"
            alt="Hostel main room"
            className="w-full h-64 object-cover rounded-lg shadow-lg"
          />
          <div className="grid grid-cols-3 gap-4">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdK_7EnAHUTC50f45EDiHbzV_tuXLUmC3hDw&s"
              alt="Hostel room 1"
              className="w-full h-32 object-cover rounded-lg shadow-lg"
            />
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              src="https://imgs.search.brave.com/o1s0-8vHT7aouOnBm1TA0IFS9nbfITvp2FKxa6M1v7U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA3LzczLzI4Lzgy/LzM2MF9GXzc3MzI4/ODIyOF9BeXRlRlli/THd4akxUNXQ4UThK/VlNvM1Z2dmQ2VVRh/RS5qcGc"
              alt="Hostel room 2"
              className="w-full h-32 object-cover rounded-lg shadow-lg"
            />
            <motion.img 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              src="https://thumbs.dreamstime.com/b/backpackers-hostel-modern-bunk-beds-dorm-room-twelve-people-inside-79935795.jpg"
              alt="Hostel room 3"
              className="w-full h-32 object-cover rounded-lg shadow-lg"
            />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-white text-4xl font-bold">
            Affordable <motion.span 
              initial={{ color: "#fff" }}
              whileInView={{ color: "#f97316" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-orange-500"
            >
              Comfort
            </motion.span>,<br />
            Wherever You Roam
          </h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1 }}
            className="inline-block bg-gray-800 p-2 mb-4"
          >
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-white text-3xl font-bold"
            >
              20+
            </motion.span>
          </motion.div>
          <p className="text-gray-400">
            Lorem ipsum dolor sit amet consectetur. Aliquam vel vitae tellus nunc. 
            Curabitur pulvinar nisi tellus non varius. In euismod lacus in tellus varius.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "#ea580c" }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 text-white px-6 py-2 rounded"
          >
            Book Now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Services;