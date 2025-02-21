import React from 'react';
import onlineBooking from '../assets/Online booking.png'
const BookingCard = () => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center mb-2">
    <img src={onlineBooking} />
    
    </div>
    <h3 className="text-white text-sm font-medium">Online Booking</h3>
    <p className="text-gray-400 text-xs text-center mt-1">Book your hostel online on your choice.</p>
  </div>
);

const Services = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Services Section */}
      <div className="mb-16">
        <h2 className="text-white text-3xl font-bold text-center mb-12">We Offer Best Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <BookingCard />
          <BookingCard />
          <BookingCard />
          <BookingCard />
        </div>
      </div>

      {/* Where Every Stay Section */}
      <div className=" gap-12 mb-32">
        <div className="space-y-6 flex justify-around items-center">
          <div className="inline-block bg-gray-800 p-2">

<div className='flex flex-col items-center'>
<span className='text-white text-[0.8rem]'>Years of Experience</span>
            <span className="text-white text-4xl font-bold">10</span>

</div>
          
            
          </div>
          <div >
          <h2 className="text-white text-5xl font-bold ">
            Where Every Stay<br />
            Feels Like<br />
            <span className="text-orange-500">Home</span>
          </h2>

          </div>
          <div className='flex flex-col w-96'>
          <p className="text-gray-400">
            Lorem ipsum dolor sit amet consectetur. Aliquam vel vitae tellus nunc. 
            Curabitur pulvinar nisi tellus non varius.
          </p>
          <button className="bg-orange-500 text-white px-6 py-2 rounded">
            View About Us
          </button>
          </div>
        </div>
      </div>

      {/* Affordable Comfort Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
        <div className="space-y-4">
          <h2 className="text-white text-4xl font-bold">
            Affordable <span className="text-orange-500">Comfort</span>,<br />
            Wherever You Roam
          </h2>
          <div className="inline-block bg-gray-800 p-2 mb-4">
            <span className="text-white text-3xl font-bold">20+</span>
          </div>
          <p className="text-gray-400">
            Lorem ipsum dolor sit amet consectetur. Aliquam vel vitae tellus nunc. 
            Curabitur pulvinar nisi tellus non varius. In euismod lacus in tellus varius.
          </p>
          <button className="bg-orange-500 text-white px-6 py-2 rounded">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;