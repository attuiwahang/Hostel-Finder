import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, Phone, Mail, Clock, Info, Check, Save, Edit, XCircle } from 'lucide-react';
import OwnerNav from '../components/OwnerNav';
import Topbar from '../components/Topbar';
import Cookies from "js-cookie";


const HostelInfo = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hostelData, setHostelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    contact: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    startingPrice: '',
    rules: '',
    checkInTime: '',
    checkOutTime: '',
    gender: 'COED'
  });

  // Handle sidebar collapse
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };


    const token = localStorage.getItem('Token')
    console.log(token)


  // Fetch hostel information when component mounts
  useEffect(() => {
    const fetchHostelInfo = async () => {
      try {
        setLoading(true);
        
        // Fetch hostel info
        const response = await axios.get('http://localhost:8870/hostel/hostelInfo', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Fetch available amenities
        const amenitiesRes = await axios.get('http://localhost:8870/hostel/amenities', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setHostelData(response.data.hostel);
        setAvailableAmenities(amenitiesRes.data.amenities || []);
        
        // Initialize form data with fetched data
        if (response.data.hostel) {
          const hostel = response.data.hostel;
          setFormData({
            contact: hostel.contact || '',
            location: hostel.location || '',
            address: hostel.address || '',
            latitude: hostel.latitude?.toString() || '',
            longitude: hostel.longitude?.toString() || '',
            description: hostel.description || '',
            startingPrice: hostel.startingPrice?.toString() || '',
            rules: hostel.rules || '',
            checkInTime: hostel.checkInTime || '',
            checkOutTime: hostel.checkOutTime || '',
            gender: hostel.gender || 'COED'
          });
          
          // Set selected amenities
          const selectedIds = hostel.amenities?.map(a => a.id) || [];
          setSelectedAmenities(selectedIds);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hostel info:', error);
        setError(error.response?.data?.message || 'Failed to fetch hostel information');
        setLoading(false);
        toast.error('Failed to fetch hostel information');
      }
    };
    
    fetchHostelInfo();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle amenity selection toggle
  const handleAmenityToggle = (amenityId) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(id => id !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };

  // Save updated hostel info
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      
      // Prepare data for update
      const updateData = {
        ...formData,
        amenityIds: selectedAmenities
      };
      
      // Send update request
      const response = await axios.put('http://localhost:8870/hostel/update', updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state with response data
      setHostelData(response.data.hostel);
      setEditMode(false);
      setLoading(false);
      toast.success('Hostel information updated successfully');
    } catch (error) {
      console.error('Error updating hostel info:', error);
      setError(error.response?.data?.message || 'Failed to update hostel information');
      setLoading(false);
      toast.error('Failed to update hostel information');
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    // Reset form data to original hostel data
    if (hostelData) {
      setFormData({
        contact: hostelData.contact || '',
        location: hostelData.location || '',
        address: hostelData.address || '',
        latitude: hostelData.latitude?.toString() || '',
        longitude: hostelData.longitude?.toString() || '',
        description: hostelData.description || '',
        startingPrice: hostelData.startingPrice?.toString() || '',
        rules: hostelData.rules || '',
        checkInTime: hostelData.checkInTime || '',
        checkOutTime: hostelData.checkOutTime || '',
        gender: hostelData.gender || 'COED'
      });
      
      // Reset selected amenities
      const selectedIds = hostelData.amenities?.map(a => a.id) || [];
      setSelectedAmenities(selectedIds);
    }
    
    setEditMode(false);
  };

  // Group amenities by category
  const getAmenitiesByCategory = () => {
    const categorized = {};
    availableAmenities.forEach(amenity => {
      if (!categorized[amenity.category]) {
        categorized[amenity.category] = [];
      }
      categorized[amenity.category].push(amenity);
    });
    return categorized;
  };

  if (loading && !hostelData) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <OwnerNav onCollapseChange={handleSidebarCollapse} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Topbar />
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !hostelData) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <OwnerNav onCollapseChange={handleSidebarCollapse} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Topbar />
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <OwnerNav onCollapseChange={handleSidebarCollapse} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header with action buttons */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Hostel Information</h1>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button 
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    Save Changes
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <XCircle size={18} />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setEditMode(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit size={18} />
                  Edit Information
                </button>
              )}
            </div>
          </div>

          {/* Hostel Info Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                </div>
                <div className="p-5">
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
                          <input
                            type="text"
                            name="contact"
                            value={formData.contact}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Starting Price (Monthly)</label>
                          <input
                            type="number"
                            name="startingPrice"
                            value={formData.startingPrice}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        ></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gender Policy</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        >
                          <option value="COED">Co-ed (Both Male & Female)</option>
                          <option value="MALE_ONLY">Male Only</option>
                          <option value="FEMALE_ONLY">Female Only</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Phone className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Contact</h3>
                          <p className="text-white">{hostelData?.contact || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Description</h3>
                          <p className="text-white whitespace-pre-line">{hostelData?.description || 'No description available'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-orange-400 mt-1 flex-shrink-0">₹</div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Starting Price (Monthly)</h3>
                          <p className="text-white">₹{hostelData?.startingPrice || '0'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-orange-400 mt-1 flex-shrink-0">👥</div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Gender Policy</h3>
                          <p className="text-white">
                            {hostelData?.gender === 'MALE_ONLY' ? 'Male Only' : 
                             hostelData?.gender === 'FEMALE_ONLY' ? 'Female Only' : 
                             'Co-ed (Both Male & Female)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Location Information</h2>
                </div>
                <div className="p-5">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Location/City</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Address</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
                          <input
                            type="text"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
                          <input
                            type="text"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Location</h3>
                          <p className="text-white">{hostelData?.location || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Address</h3>
                          <p className="text-white">{hostelData?.address || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Coordinates</h3>
                          <p className="text-white">{hostelData?.latitude}, {hostelData?.longitude}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules and Policies */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Rules and Policies</h2>
                </div>
                <div className="p-5">
                  {editMode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Check-in Time</label>
                        <input
                          type="time"
                          name="checkInTime"
                          value={formData.checkInTime}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Check-out Time</label>
                        <input
                          type="time"
                          name="checkOutTime"
                          value={formData.checkOutTime}
                          onChange={handleInputChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Rules and Policies</label>
                        <textarea
                          name="rules"
                          value={formData.rules}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                          placeholder="Enter hostel rules and policies here..."
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Check-in / Check-out Time</h3>
                          <p className="text-white">
                            {hostelData?.checkInTime ? `Check-in: ${hostelData.checkInTime}` : 'Check-in time not specified'} / 
                            {hostelData?.checkOutTime ? ` Check-out: ${hostelData.checkOutTime}` : ' Check-out time not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Info className="text-orange-400 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-400">Rules and Policies</h3>
                          {hostelData?.rules ? (
                            <p className="text-white whitespace-pre-line">{hostelData.rules}</p>
                          ) : (
                            <p className="text-gray-400 italic">No rules specified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Hostel Photos */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Photos</h2>
                  {/* This would be a separate feature */}
                  <button className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                    Manage Photos
                  </button>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {hostelData?.photos && hostelData.photos.length > 0 ? (
                      hostelData.photos.map((photo, index) => (
                        <div key={photo.id} className="aspect-video rounded-md overflow-hidden">
                          <img 
                            src={photo.photoUrl} 
                            alt={photo.caption || `Hostel photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center text-gray-400">
                        <p>No photos uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Amenities</h2>
                </div>
                {editMode ? (
                  <div className="p-5">
                    {Object.entries(getAmenitiesByCategory()).map(([category, amenities]) => (
                      <div key={category} className="mb-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">{category}</h3>
                        <div className="space-y-2">
                          {amenities.map(amenity => (
                            <div key={amenity.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`amenity-${amenity.id}`}
                                checked={selectedAmenities.includes(amenity.id)}
                                onChange={() => handleAmenityToggle(amenity.id)}
                                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-600 rounded bg-gray-700"
                              />
                              <label htmlFor={`amenity-${amenity.id}`} className="ml-2 text-gray-300 text-sm">
                                {amenity.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(getAmenitiesByCategory()).length === 0 && (
                      <p className="text-gray-400 text-center py-4">No amenities available</p>
                    )}
                  </div>
                ) : (
                  <div className="p-5">
                    {hostelData?.amenitiesByCategory && Object.entries(hostelData.amenitiesByCategory).length > 0 ? (
                      Object.entries(hostelData.amenitiesByCategory).map(([category, amenities]) => (
                        <div key={category} className="mb-4">
                          <h3 className="text-sm font-medium text-orange-400 mb-2">{category}</h3>
                          <div className="grid grid-cols-1 gap-1">
                            {amenities.map(amenity => (
                              <div key={amenity.id} className="flex items-center text-gray-300 text-sm">
                                <Check className="h-4 w-4 mr-2 text-green-400" />
                                {amenity.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4">No amenities specified</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelInfo;