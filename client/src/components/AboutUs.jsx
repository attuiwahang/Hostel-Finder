import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const AboutUs = () => {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-slate-900 text-white p-8">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Find Your Perfect Hostel
          </h1>
          <p className="text-lg text-gray-300">
            Your trusted platform for finding the best hostels worldwide. We've been helping travelers find their perfect stay since 2024.
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <h2 className="text-sm uppercase tracking-wider">
            DISCOVER YOUR NEXT ADVENTURE
          </h2>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-20">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 5.5V2l-4 4 4 4V6.5a7.5 7.5 0 0 1 7.5 7.5h2A9.5 9.5 0 0 0 13 5.5z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Why We Started</h3>
          <p className="text-gray-400">
            Born from a passion for travel and community, we're here to revolutionize how you find your perfect hostel stay.
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Idea of Hostel Finder</h3>
          <p className="text-gray-400">
            Connecting travelers with authentic, comfortable, and affordable accommodations worldwide.
          </p>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Future Of Hostel Finder</h3>
          <p className="text-gray-400">
            Building a global network of trusted hostels and creating unforgettable travel experiences.
          </p>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="max-w-6xl mx-20 flex justify-between gap-20">
      <div className="grid grid-rows-2 gap-4">
          <img 
            src="https://imgs.search.brave.com/Fe6dSUusYG0oGtmWuWLR3uVs_m5aOAMY9szecv4dAkw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA5LzM3LzY4Lzg2/LzM2MF9GXzkzNzY4/ODY0NV9jcjBydXVu/UWhER2RUVkZyTkNp/WWVmNkpxcGVPeWR1/OC5qcGc"
            alt="Hostel main room"
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="grid grid-cols-3 gap-4">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdK_7EnAHUTC50f45EDiHbzV_tuXLUmC3hDw&s"
              alt="Hostel room 1"
              className="w-full h-32 object-cover rounded-lg"
            />
            <img 
              src="https://imgs.search.brave.com/o1s0-8vHT7aouOnBm1TA0IFS9nbfITvp2FKxa6M1v7U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA3LzczLzI4Lzgy/LzM2MF9GXzc3MzI4/ODIyOF9BeXRlRlli/THd4akxUNXQ4UThK/VlNvM1Z2dmQ2VVRh/RS5qcGc"
              alt="Hostel room 2"
              className="w-full h-32 object-cover rounded-lg"
            />
            <img 
              src="https://thumbs.dreamstime.com/b/backpackers-hostel-modern-bunk-beds-dorm-room-twelve-people-inside-79935795.jpg"
              alt="Hostel room 3"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        </div>
        <div className="mt-8 text-center space-y-4">
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Experience unique stays in carefully curated hostels. From cozy dorms to private rooms, 
            we ensure comfort and quality in every location.
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Our network spans across vibrant city centers, serene beachfronts, and mountain retreats.
            Each location is personally vetted to meet our high standards of cleanliness, security, and atmosphere.
          </p>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Connect with fellow travelers in well-designed common spaces, enjoy modern amenities, 
            and create lasting memories. Whether you're a solo backpacker or traveling with friends,
            our hostels provide the perfect blend of social atmosphere and personal comfort.
          </p>
          <div className="mt-6">
            <button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Explore Our Hostels
            </button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
    </>
  );
};

export default AboutUs;