import React, { useState, useEffect } from 'react';
import { Filter, Search, Plus, Edit, Trash, Lock, Users, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Room = () => {
  const [activeFilter, setActiveFilter] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  
  // New room form state
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'Dorm',
    beds: '',
    price: '',
    status: 'Available'
  });
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });
  
  const roomData = [
    {
      id: 101,
      name: 'Room 101',
      type: 'Dorm',
      beds: 6,
      occupied: 4,
      price: 25,
      status: 'Available',
      statusColor: 'green'
    },
    {
      id: 102,
      name: 'Room 102',
      type: 'Dorm',
      beds: 4,
      occupied: 2,
      price: 20,
      status: 'Maintenance',
      statusColor: 'yellow'
    },
    {
      id: 103,
      name: 'Room 103',
      type: 'Private',
      beds: 1,
      occupied: 0,
      price: 45,
      status: 'Available',
      statusColor: 'green'
    },
    {
      id: 104,
      name: 'Room 104',
      type: 'Family',
      beds: 3,
      occupied: 3,
      price: 60,
      status: 'Occupied',
      statusColor: 'red'
    }
  ];

  // Filter rooms based on active filter and search query
  useEffect(() => {
    let result = [...roomData];
    
    // Apply type filter
    if (activeFilter !== 'All Types') {
      result = result.filter(room => room.type === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(room => 
        room.name.toLowerCase().includes(query) || 
        room.type.toLowerCase().includes(query) ||
        (room.status && room.status.toLowerCase().includes(query))
      );
    }
    
    setFilteredRooms(result);
  }, [activeFilter, searchQuery]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: value
    });
  };
  
  // Handle add room form submission
  const handleAddRoomSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!newRoom.name || !newRoom.beds || !newRoom.price) {
      setNotification({
        show: true,
        message: 'Please fill in all required fields',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      
      return;
    }
    
    // Logic to add a new room would go here
    // For this example, we'll just show a success message
    setShowAddRoomForm(false);
    
    // Reset form
    setNewRoom({
      name: '',
      type: 'Dorm',
      beds: '',
      price: '',
      status: 'Available'
    });
    
    // Show success notification
    setNotification({
      show: true,
      message: 'Room successfully verified!',
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'green';
      case 'Maintenance': return 'yellow';
      case 'Occupied': return 'red';
      default: return 'gray';
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage="rooms" />
      
      <div className="flex-1 p-6 overflow-auto bg-gray-100 text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rooms</h1>
          <button 
            onClick={() => setShowAddRoomForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition duration-200"
          >
            <Plus size={18} className="mr-2" />
            Add Room
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search room..." 
              className="w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-4 text-gray-800 focus:border-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className={`px-4 py-2 rounded-md transition duration-200 ${
              activeFilter === 'All Types' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => setActiveFilter('All Types')}
          >
            All Types
          </button>
          
          <button 
            className={`px-4 py-2 rounded-md transition duration-200 ${
              activeFilter === 'Dorm' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => setActiveFilter('Dorm')}
          >
            Dorm
          </button>
          
          <button 
            className={`px-4 py-2 rounded-md transition duration-200 ${
              activeFilter === 'Private' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => setActiveFilter('Private')}
          >
            Private
          </button>
          
          <button 
            className={`px-4 py-2 rounded-md transition duration-200 ${
              activeFilter === 'Family' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => setActiveFilter('Family')}
          >
            Family
          </button>
        </div>
        
        <button className="flex items-center bg-white border border-gray-300 rounded-md px-4 py-2 mb-6 hover:bg-gray-100 transition duration-200 text-gray-800">
          <Filter size={16} className="mr-2" />
          More Filters
        </button>
        
        {filteredRooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No rooms match your current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRooms.map(room => {
              const statusColor = getStatusColor(room.status);
              return (
                <div key={room.id} className="relative bg-white rounded-md overflow-hidden shadow-lg hover:shadow-xl transition duration-200">
                  <div className={`absolute left-0 top-0 w-1 h-full bg-${statusColor}-500`}></div>
                  <div className="p-4 pl-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-xl font-semibold">{room.name}</h2>
                        <p className="text-gray-500">{room.type} Room</p>
                      </div>
                      <div className="flex space-x-3">
                        <Edit 
                          size={18} 
                          className="text-gray-500 hover:text-gray-800 cursor-pointer transition duration-200"
                        />
                        <Trash 
                          size={18} 
                          className="text-gray-500 hover:text-red-500 cursor-pointer transition duration-200" 
                        />
                        <Lock 
                          size={18} 
                          className="text-gray-500 hover:text-yellow-500 cursor-pointer transition duration-200" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className="text-gray-500">{room.beds} beds</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="text-gray-500 mr-2" />
                        <span className={`text-gray-500 ${room.occupied === room.beds ? 'text-yellow-500' : ''}`}>
                          {room.occupied}/{room.beds} occupied
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm bg-${statusColor}-100 text-${statusColor}-700`}>
                          {room.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold">${room.price}</span>
                        <span className="text-gray-500">/night</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline transition duration-200">
                        View Details
                      </a>
                      <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline transition duration-200">
                        Manage Bookings
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Add Room Form Modal */}
        {showAddRoomForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6 border border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add New Room</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAddRoomForm(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddRoomSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newRoom.name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g. Room 105"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type
                    </label>
                    <select
                      name="type"
                      value={newRoom.type}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Dorm">Dorm</option>
                      <option value="Private">Private</option>
                      <option value="Family">Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Beds*
                    </label>
                    <input
                      type="number"
                      name="beds"
                      value={newRoom.beds}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newRoom.status}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night (USD)*
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={newRoom.price}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                    onClick={() => setShowAddRoomForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Notification */}
        {notification.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;