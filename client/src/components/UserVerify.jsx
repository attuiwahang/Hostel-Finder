

import axios from 'axios';
import React, { useEffect, useState } from 'react';

const UserVerify = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8870/getUsersForVerification");
        setHostels(response.data.users);
       console.log(response)
      } catch (err) {
        setError("Failed to load hostels.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center text-gray-500">Loading hostels...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  const handleAccept = async (id) => {
    try {
      const response = await axios.post(`http://localhost:8870/verifyUser/${id}`);
      console.log(response);
      
      setHostels(hostels.filter(hostel => hostel.id !== id));
    } catch (error) {
      console.error("Error verifying user", error);
    }
  };

  const handleDecline = async (id) => {
    try {
      const response = await axios.post(`http://localhost:8870/deleteUser/${id}`);
      console.log(response);
      
      setHostels(hostels.filter(hostel => hostel.id !== id));
    } catch (error) {
      console.error("Error verifying user", error);
    }
    // Update state to remove the declined hostel
    setHostels(hostels.filter(hostel => hostel.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Hostel Verification</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {hostels.map(({ id, mainPhoto, hostelName, ownerName, location, email }) => (
          <div key={id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <img src={mainPhoto} alt={hostelName} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{hostelName}</h3>
              <p className="text-gray-700">Owner: {ownerName}</p>
              <p className="text-gray-600">Location: {location}</p>
              <p className="text-blue-500">Email: {email}</p>
              <div className='flex gap-2 mt-3'>
                <button 
                  className='bg-sky-500 py-2 px-4 text-white rounded-sm' 
                  onClick={() => handleAccept(id)}
                >
                  Accept
                </button>
                <button 
                  className='bg-red-500 py-2 px-4 text-white rounded-sm' 
                  onClick={() => handleDecline(id)}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserVerify;
