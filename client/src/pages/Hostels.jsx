import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, MapPin, Mail, User, Home } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { NavLink } from 'react-router';

const Hostels = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8870/hostel/getHostels");
        if (response.data && Array.isArray(response.data.hostels)) {
          setHostels(response.data.hostels);
        } else {
          throw new Error("Unexpected API response format");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setError("Failed to fetch hostels. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading hostels...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center bg-red-50 p-8 rounded-lg shadow-md">
            <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
            <p className="text-gray-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Available Hostels</h1>
          
          {hostels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">No hostels available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hostels.map((hostel) => (
                <div 
                  key={hostel.id} 
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  {hostel.mainPhoto && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={hostel.mainPhoto} 
                        alt={hostel.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">{hostel.name}</h2>
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>{hostel.ownerName}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Home className="h-4 w-4 mr-2" />
                        <span>{hostel.hostelName}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{hostel.email}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{hostel.location}</span>
                      </div>
                    </div>
                    
                    <NavLink to={`/hostelDetails/${hostel.id}`}>
                            <button className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                                View Details
                            </button>
                        </NavLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Hostels;