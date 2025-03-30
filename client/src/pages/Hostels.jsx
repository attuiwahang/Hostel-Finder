import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, MapPin, Mail, User, Home, Star, Search, Filter, ChevronDown, Calendar, Wifi, Coffee, Moon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { NavLink } from 'react-router';

const Hostels = () => {
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8870/hostel/getHostels");
        if (response.data && Array.isArray(response.data.hostels)) {
          setHostels(response.data.hostels);
          setFilteredHostels(response.data.hostels);
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

console.log(hostels)

  useEffect(() => {
    // Filter hostels based on search term
    const results = hostels.filter(hostel => {
      // Check if properties exist before calling toLowerCase()
      const nameMatch = hostel.name && typeof hostel.name === 'string' 
        ? hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) 
        : false;
      
      const locationMatch = hostel.location && typeof hostel.location === 'string' 
        ? hostel.location.toLowerCase().includes(searchTerm.toLowerCase()) 
        : false;
      
      const hostelNameMatch = hostel.hostelName && typeof hostel.hostelName === 'string' 
        ? hostel.hostelName.toLowerCase().includes(searchTerm.toLowerCase()) 
        : false;
      
      return nameMatch || locationMatch || hostelNameMatch;
    });

    // Apply sorting
    let sortedResults = [...results];
    if (sortBy === 'name') {
      sortedResults.sort((a, b) => {
        if (!a.name) return 1;
        if (!b.name) return -1;
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === 'location') {
      sortedResults.sort((a, b) => {
        if (!a.location) return 1;
        if (!b.location) return -1;
        return a.location.localeCompare(b.location);
      });
    }

    setFilteredHostels(sortedResults);
  }, [searchTerm, hostels, sortBy]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center bg-gray-800/80 p-8 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-orange-400" />
            <p className="text-xl text-white font-medium">Loading hostels...</p>
            <p className="text-gray-400 mt-2">Please wait while we find your perfect place</p>
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
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center bg-gray-800/80 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 backdrop-blur-sm">
            <div className="bg-red-900/40 text-red-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
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
      {/* Hero Section with Background */}
      <div className="relative bg-gray-900 py-20">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-black/70 z-0"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">We Are Here,</h1>
          <h2 className="text-3xl font-semibold text-orange-400 mb-4">
            To Help You Find Your Place
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Browse through our selection of quality hostels for a comfortable and affordable stay
          </p>
          
          {/* Search Bar - Hero Style */}
          <div className="max-w-4xl mx-auto bg-black/50 p-6 rounded-xl border border-gray-700 backdrop-blur">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Which city do you prefer?"
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  className="w-full pl-10 px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input id="wifi" type="checkbox" className="h-4 w-4 text-orange-500 focus:ring-orange-500 bg-gray-700 border-gray-500 rounded" />
                  <label htmlFor="wifi" className="ml-2 text-white">Free WiFi</label>
                </div>
                <div className="flex items-center">
                  <input id="breakfast" type="checkbox" className="h-4 w-4 text-orange-500 focus:ring-orange-500 bg-gray-700 border-gray-500 rounded" />
                  <label htmlFor="breakfast" className="ml-2 text-white">Breakfast Included</label>
                </div>
                <div className="flex items-center">
                  <input id="private" type="checkbox" className="h-4 w-4 text-orange-500 focus:ring-orange-500 bg-gray-700 border-gray-500 rounded" />
                  <label htmlFor="private" className="ml-2 text-white">Private Rooms</label>
                </div>
                <div className="md:col-span-3 mt-4">
                  <select
                    onChange={handleSortChange}
                    value={sortBy}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="default">Sort By</option>
                    <option value="name">Name</option>
                    <option value="location">Location</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          {/* Results Count */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">
              {filteredHostels.length} {filteredHostels.length === 1 ? 'Hostel' : 'Hostels'} Available
            </h2>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-orange-400 hover:text-orange-300 font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
          
          {filteredHostels.length === 0 ? (
            <div className="bg-gray-800/80 rounded-xl shadow-xl p-12 text-center border border-gray-700 backdrop-blur-sm">
              <div className="text-gray-400 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No hostels found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters to find what you're looking for</p>
              <button 
                onClick={() => {setSearchTerm(''); setSortBy('default');}}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHostels.map((hostel) => (
                <div 
                  key={hostel.id} 
                  className="bg-gray-800/80 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-700 group"
                >
                  {hostel.mainPhoto ? (
                    <div className="relative h-60 overflow-hidden">
                      <img 
                        src={hostel.mainPhoto} 
                        alt={hostel.hostelName} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-0 right-0 m-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        4.8 <Star className="inline h-3 w-3 ml-1" />
                      </div>
                      <div className="absolute top-0 left-0 m-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                      {/* Price Badge */}
                      <div className="absolute bottom-0 right-0 m-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-bold">
                        ₹899<span className="text-xs font-normal ml-1">/ month</span>
                      </div>
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                    </div>
                  ) : (
                    <div className="h-60 bg-gray-700 flex items-center justify-center">
                      <Home className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                        {hostel.hostelName || 'Unnamed Hostel'}
                      </h2>
                      <div className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-medium rounded-full border border-green-700/50">
                        Available
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <MapPin className="h-4 w-4 text-orange-400 mr-2" />
                      <span className="text-gray-300 text-sm">{hostel.location || 'Location not specified'}</span>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                      <div className="flex items-center text-gray-300">
                        <User className="h-4 w-4 text-gray-500 mr-3" />
                        <span className="text-sm">{hostel.ownerName || 'Owner not specified'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Home className="h-4 w-4 text-gray-500 mr-3" />
                        <span className="text-sm">{hostel.hostelName || 'Hostel name not available'}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Mail className="h-4 w-4 text-gray-500 mr-3" />
                        <span className="text-sm truncate">{hostel.email || 'Email not available'}</span>
                      </div>
                    </div>
                    
                    {/* Amenities with icons */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="px-3 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 text-xs rounded-full flex items-center">
                        <Wifi className="h-3 w-3 mr-1" />
                        WiFi
                      </div>
                      <div className="px-3 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 text-xs rounded-full flex items-center">
                        <Coffee className="h-3 w-3 mr-1" />
                        Breakfast
                      </div>
                      <div className="px-3 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 text-xs rounded-full flex items-center">
                        <Moon className="h-3 w-3 mr-1" />
                        24/7
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <NavLink to={`/hostelDetails/${hostel.id}`} className="block">
                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 shadow-lg hover:shadow-orange-500/30">
                          View Details
                        </button>
                      </NavLink>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredHostels.length > 0 && (
            <div className="flex justify-center mt-12">
              <nav aria-label="Pagination" className="flex justify-center">
                <ul className="flex items-center space-x-2">
                  <li>
                    <button className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                      &laquo; Previous
                    </button>
                  </li>
                  <li>
                    <button className="p-2 w-10 h-10 rounded-md border border-orange-500 bg-orange-500 text-white">
                      1
                    </button>
                  </li>
                  <li>
                    <button className="p-2 w-10 h-10 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                      2
                    </button>
                  </li>
                  <li>
                    <button className="p-2 w-10 h-10 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                      3
                    </button>
                  </li>
                  <li>
                    <button className="p-2 rounded-md border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                      Next &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Hostels;