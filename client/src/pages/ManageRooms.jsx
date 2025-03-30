import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Plus, Edit, Trash2, Search, RefreshCw, BedDouble, DoorOpen, Tag, 
  CheckCircle, X, Upload, Save, HashIcon, 
  ArrowDown, ArrowUp, Eye
} from 'lucide-react';
import OwnerNav from '../components/OwnerNav';
import Topbar from '../components/Topbar';

const ManageRooms = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [amenities, setAmenities] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'roomNumber', direction: 'ascending' });

  // Form data for new/edit room
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'SINGLE_ROOM',
    floorNumber: '',
    monthlyPrice: '',
    securityDeposit: '',
    description: '',
    totalBeds: 1,
    availableBeds: 1,
    amenityIds: []
  });

  // Room photos state
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Get token from local storage
  const token = localStorage.getItem('Token');

  // Handle sidebar collapse
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  // Initialize hostelOwnerId - you'd get this from token or context
  const hostelOwnerId = 1; // Replace with actual ID from your auth context or token

  // Fetch rooms and amenities data when component mounts
  useEffect(() => {
    fetchRooms();
    fetchAmenities();
  }, []);

  // Function to fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8870/room?hostelOwnerId=${hostelOwnerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRooms(response.data.rooms || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError(error.response?.data?.message || 'Failed to fetch rooms');
      setLoading(false);
      toast.error('Failed to fetch rooms');
    }
  };

  // Function to fetch amenities
  const fetchAmenities = async () => {
    try {
      const response = await axios.get('http://localhost:8870/hostel/amenities', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAmenities(response.data.amenities || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast.error('Failed to fetch amenities');
    }
  };

  // Filter rooms based on searchTerm and filterType
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      (room.roomNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (room.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (room.floorNumber?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType ? room.roomType === filterType : true;
    return matchesSearch && matchesFilter;
  });

  // Sort rooms based on sortConfig
  const sortedRooms = React.useMemo(() => {
    let sortableRooms = [...filteredRooms];
    if (sortConfig.key) {
      sortableRooms.sort((a, b) => {
        // Handle null or undefined values
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        // Compare values based on type
        if (typeof a[sortConfig.key] === 'string') {
          const aValue = a[sortConfig.key].toLowerCase();
          const bValue = b[sortConfig.key].toLowerCase();
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else {
          // For numbers
          return sortConfig.direction === 'ascending' 
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }
    return sortableRooms;
  }, [filteredRooms, sortConfig]);

  // Request sort function
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction icon
  const getSortDirectionIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      roomNumber: '',
      roomType: 'SINGLE_ROOM',
      floorNumber: '',
      monthlyPrice: '',
      securityDeposit: '',
      description: '',
      totalBeds: 1,
      availableBeds: 1,
      amenityIds: []
    });
    setPhotos([]);
    setFormErrors({});
  };

  // Handle opening add modal
  const openAddModal = () => {
    resetFormData();
    setIsAddModalOpen(true);
  };

  // Handle room selection for edit
  const openEditModal = (room) => {
    setSelectedRoom(room);
    // Populate form with selected room data
    setFormData({
      roomNumber: room.roomNumber || '',
      roomType: room.roomType || 'SINGLE_ROOM',
      floorNumber: room.floorNumber || '',
      monthlyPrice: room.monthlyPrice?.toString() || '',
      securityDeposit: room.securityDeposit?.toString() || '',
      description: room.description || '',
      totalBeds: room.totalBeds || 1,
      availableBeds: room.availableBeds || 1,
      amenityIds: room.amenities?.map(a => a.amenityId || a.id) || []
    });
    
    // Set photos if available
    if (room.photos && room.photos.length > 0) {
      setPhotos(room.photos.map(photo => ({
        id: photo.id,
        url: photo.photoUrl,
        caption: photo.caption || ''
      })));
    } else {
      setPhotos([]);
    }
    
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handle opening detail modal
  const openDetailModal = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  // Handle opening delete confirmation modal
  const openDeleteModal = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle amenity selection toggle
  const handleAmenityToggle = (amenityId) => {
    setFormData(prev => {
      const amenityIds = [...prev.amenityIds];
      if (amenityIds.includes(amenityId)) {
        return { ...prev, amenityIds: amenityIds.filter(id => id !== amenityId) };
      } else {
        return { ...prev, amenityIds: [...amenityIds, amenityId] };
      }
    });
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, you'd upload the file to your server/cloud storage
    // Here we'll simulate that by creating a local URL
    try {
      setUploadingPhoto(true);
      
      // In production, replace this with your actual file upload logic
      // This is a mock implementation
      setTimeout(() => {
        const newPhoto = {
          id: `temp-${Date.now()}`, // In production, this would be the ID from your server
          url: URL.createObjectURL(file),
          caption: file.name
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        setUploadingPhoto(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  // Handle photo removal
  const handleRemovePhoto = (photoId) => {
    setPhotos(photos.filter(photo => photo.id !== photoId));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.roomNumber.trim()) {
      errors.roomNumber = 'Room number is required';
    }
    
    if (!formData.monthlyPrice || formData.monthlyPrice <= 0) {
      errors.monthlyPrice = 'Valid monthly price is required';
    }
    
    if (!formData.totalBeds || formData.totalBeds <= 0) {
      errors.totalBeds = 'Total beds must be greater than 0';
    }
    
    if (formData.totalBeds < formData.availableBeds) {
      errors.availableBeds = 'Available beds cannot exceed total beds';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add room submission
  const handleAddRoom = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Prepare data for API
      const roomData = {
        ...formData,
        hostelOwnerId,
        photos: photos.map(photo => ({
          url: photo.url,
          caption: photo.caption
        }))
      };
      
      // Send request to API
      const response = await axios.post('http://localhost:8870/room', roomData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state with new room
      setRooms(prev => [...prev, response.data.room]);
      
      // Close modal and reset form
      setIsAddModalOpen(false);
      resetFormData();
      
      toast.success('Room added successfully');
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error(error.response?.data?.message || 'Failed to add room');
    } finally {
      setFormSubmitting(false);
    }
  };

  console.log(formData)
  // Handle edit room submission
  const handleEditRoom = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedRoom) {
      return;
    }
    
    try {
      setFormSubmitting(true);

  
      
      // Prepare data for API
      const roomData = {
        ...formData,
        photos: photos.map(photo => ({
          id: photo.id?.startsWith('temp-') ? undefined : photo.id,
          url: photo.url,
          caption: photo.caption || ""
        }))
      };
      
      // Send request to API
      const response = await axios.put(`http://localhost:8870/room/${selectedRoom.id}`, roomData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state with edited room
      setRooms(prev => 
        prev.map(room => 
          room.id === selectedRoom.id ? response.data.room : room
        )
      );
      
      // Close modal and reset form
      setIsEditModalOpen(false);
      setSelectedRoom(null);
      resetFormData();
      
      toast.success('Room updated successfully');
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error(error.response?.data?.message || 'Failed to update room');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle delete room submission
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      setFormSubmitting(true);
      
      // Send delete request to API
      await axios.delete(`http://localhost:8870/room/${selectedRoom.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state by removing deleted room
      setRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
      
      // Close modal
      setIsDeleteModalOpen(false);
      setSelectedRoom(null);
      
      toast.success('Room deleted successfully');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error(error.response?.data?.message || 'Failed to delete room');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Function to get room type display name
  const getRoomTypeDisplay = (type) => {
    const roomTypes = {
      DORMITORY: 'Dormitory',
      SHARED_2: '2-Person Shared',
      SHARED_3: '3-Person Shared',
      SHARED_4: '4-Person Shared',
      SINGLE_ROOM: 'Single Room',
      DOUBLE_ROOM: 'Double Room'
    };
    return roomTypes[type] || type;
  };

  // Function to get badge color based on room type
  const getRoomTypeBadgeColor = (type) => {
    const colors = {
      DORMITORY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHARED_2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      SHARED_3: 'bg-green-500/20 text-green-400 border-green-500/30',
      SHARED_4: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SINGLE_ROOM: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      DOUBLE_ROOM: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Group amenities by category
  const getAmenitiesByCategory = () => {
    const categorized = {};
    amenities.forEach(amenity => {
      if (!categorized[amenity.category]) {
        categorized[amenity.category] = [];
      }
      categorized[amenity.category].push(amenity);
    });
    return categorized;
  };

  // Get room amenities by category for detail view
  const getRoomAmenitiesByCategory = (roomAmenities) => {
    if (!roomAmenities || roomAmenities.length === 0) return {};
    
    const categorized = {};
    roomAmenities.forEach(item => {
      const amenity = item.amenity || item;
      if (!amenity || !amenity.category) return;
      
      if (!categorized[amenity.category]) {
        categorized[amenity.category] = [];
      }
      categorized[amenity.category].push(amenity);
    });
    return categorized;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <OwnerNav onCollapseChange={handleSidebarCollapse} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header with action buttons */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">Manage Rooms</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200"
              >
                <option value="">All Room Types</option>
                <option value="DORMITORY">Dormitory</option>
                <option value="SHARED_2">2-Person Shared</option>
                <option value="SHARED_3">3-Person Shared</option>
                <option value="SHARED_4">4-Person Shared</option>
                <option value="SINGLE_ROOM">Single Room</option>
                <option value="DOUBLE_ROOM">Double Room</option>
              </select>
              <button 
                onClick={openAddModal}
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Add Room
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded-lg">
              <p>{error}</p>
              <button 
                onClick={fetchRooms}
                className="mt-2 flex items-center gap-1 text-red-400 hover:text-red-300"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sortedRooms.length === 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <DoorOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Rooms Found</h3>
              <p className="text-gray-400 mb-6">
                {rooms.length === 0 
                  ? "You haven't added any rooms yet. Add your first room to get started."
                  : "No rooms match your current search or filter criteria."}
              </p>
              {rooms.length === 0 ? (
                <button 
                  onClick={openAddModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Add Your First Room
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                  }}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Table View */}
          {!loading && !error && sortedRooms.length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th 
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('roomNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Room Number</span>
                          {getSortDirectionIcon('roomNumber')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('roomType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Room Type</span>
                          {getSortDirectionIcon('roomType')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('totalBeds')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Beds</span>
                          {getSortDirectionIcon('totalBeds')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('monthlyPrice')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Price</span>
                          {getSortDirectionIcon('monthlyPrice')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amenities
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {sortedRooms.map((room) => (
                      <tr 
                        key={room.id} 
                        className="hover:bg-gray-750 cursor-pointer"
                        onClick={() => openDetailModal(room)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                              {room.photos && room.photos.length > 0 ? (
                                <img 
                                  src={room.photos[0].photoUrl} 
                                  alt={`Room ${room.roomNumber}`}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <BedDouble className="text-gray-500" size={20} />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{room.roomNumber || `Room ${room.id}`}</div>
                              {room.floorNumber && (
                                <div className="text-xs text-gray-400">Floor: {room.floorNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoomTypeBadgeColor(room.roomType)}`}>
                            {getRoomTypeDisplay(room.roomType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {room.totalBeds} {room.totalBeds === 1 ? 'Bed' : 'Beds'}
                          </div>
                          <div className={`text-xs ${room.availableBeds > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {room.availableBeds} Available
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-orange-400 font-semibold">₹{room.monthlyPrice?.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-400">/ month</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {room.amenities && room.amenities.slice(0, 2).map((amenity) => (
                              <span 
                                key={amenity.id || amenity.amenityId} 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300"
                              >
                                {amenity.amenity ? amenity.amenity.name : amenity.name}
                              </span>
                            ))}
                            {room.amenities && room.amenities.length > 2 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                +{room.amenities.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(room);
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(room);
                              }}
                              className="text-gray-400 hover:text-orange-400 transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(room);
                              }}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

    

{/* Room Detail Modal */}
{isDetailModalOpen && selectedRoom && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
      <div className="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Room Details:</span> 
          <span className="text-orange-400">{selectedRoom.roomNumber || `Room ${selectedRoom.id}`}</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRoomTypeBadgeColor(selectedRoom.roomType)}`}>
            {getRoomTypeDisplay(selectedRoom.roomType)}
          </span>
        </h2>
        <button 
          onClick={() => setIsDetailModalOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="p-6">
        {/* Room photos */}
        {selectedRoom.photos && selectedRoom.photos.length > 0 ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRoom.photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-video rounded-lg overflow-hidden bg-gray-700 relative group"
                >
                  <img 
                    src={photo.photoUrl}
                    alt={photo.caption || `Room ${selectedRoom.roomNumber}`}
                    className="h-full w-full object-cover"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-sm p-2">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-gray-700 rounded-lg h-48 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BedDouble size={48} className="mx-auto mb-2" />
              <p>No photos available for this room</p>
            </div>
          </div>
        )}
        
        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Room Information</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <HashIcon className="text-gray-500 mt-1 mr-3" size={18} />
                <div>
                  <div className="text-gray-400 text-sm">Room Number</div>
                  <div>{selectedRoom.roomNumber || '-'}</div>
                </div>
              </div>
              <div className="flex items-start">
                <BedDouble className="text-gray-500 mt-1 mr-3" size={18} />
                <div>
                  <div className="text-gray-400 text-sm">Room Type</div>
                  <div>{getRoomTypeDisplay(selectedRoom.roomType)}</div>
                </div>
              </div>
              {selectedRoom.floorNumber && (
                <div className="flex items-start">
                  <DoorOpen className="text-gray-500 mt-1 mr-3" size={18} />
                  <div>
                    <div className="text-gray-400 text-sm">Floor</div>
                    <div>{selectedRoom.floorNumber}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <BedDouble className="text-gray-500 mt-1 mr-3" size={18} />
                <div>
                  <div className="text-gray-400 text-sm">Beds</div>
                  <div>
                    {selectedRoom.totalBeds} Total, {selectedRoom.availableBeds} Available
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Pricing</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <Tag className="text-gray-500 mt-1 mr-3" size={18} />
                <div>
                  <div className="text-gray-400 text-sm">Monthly Price</div>
                  <div className="text-orange-400 font-semibold">₹{selectedRoom.monthlyPrice?.toLocaleString('en-IN')}</div>
                </div>
              </div>
              {selectedRoom.securityDeposit && (
                <div className="flex items-start">
                  <Tag className="text-gray-500 mt-1 mr-3" size={18} />
                  <div>
                    <div className="text-gray-400 text-sm">Security Deposit</div>
                    <div>₹{selectedRoom.securityDeposit?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Description */}
        {selectedRoom.description && (
          <div className="mb-6">
            <h3 className="text-white text-lg font-medium mb-3">Description</h3>
            <div className="text-gray-300 bg-gray-700/50 p-4 rounded-lg">
              {selectedRoom.description}
            </div>
          </div>
        )}
        
        {/* Amenities */}
        {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
          <div>
            <h3 className="text-white text-lg font-medium mb-4">Amenities</h3>
            <div className="space-y-4">
              {Object.entries(getRoomAmenitiesByCategory(selectedRoom.amenities)).map(([category, categoryAmenities]) => (
                <div key={category}>
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryAmenities.map((amenity) => (
                      <div 
                        key={amenity.id}
                        className="flex items-center p-2 bg-gray-700/50 rounded-lg"
                      >
                        <CheckCircle className="text-green-400 mr-2" size={16} />
                        <span className="text-gray-200 text-sm">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
        <button
          onClick={() => setIsDetailModalOpen(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            setIsDetailModalOpen(false);
            openEditModal(selectedRoom);
          }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Edit size={16} />
          Edit Room
        </button>
      </div>
    </div>
  </div>
)}

{/* Add Room Modal */}
{isAddModalOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
      <div className="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Add New Room</h2>
        <button 
          onClick={() => setIsAddModalOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleAddRoom}>
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. A-101"
                  className={`w-full bg-gray-700 border ${formErrors.roomNumber ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.roomNumber && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.roomNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Room Type
                </label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SINGLE_ROOM">Single Room</option>
                  <option value="DOUBLE_ROOM">Double Room</option>
                  <option value="SHARED_2">2-Person Shared</option>
                  <option value="SHARED_3">3-Person Shared</option>
                  <option value="SHARED_4">4-Person Shared</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
          
          {/* Beds Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Beds Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Total Beds *
                </label>
                <input
                  type="number"
                  name="totalBeds"
                  value={formData.totalBeds}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full bg-gray-700 border ${formErrors.totalBeds ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.totalBeds && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.totalBeds}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Available Beds *
                </label>
                <input
                  type="number"
                  name="availableBeds"
                  value={formData.availableBeds}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.totalBeds}
                  className={`w-full bg-gray-700 border ${formErrors.availableBeds ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.availableBeds && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.availableBeds}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Monthly Price (₹) *
                </label>
                <input
                  type="number"
                  name="monthlyPrice"
                  value={formData.monthlyPrice}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  min="0"
                  className={`w-full bg-gray-700 border ${formErrors.monthlyPrice ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.monthlyPrice && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.monthlyPrice}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  name="securityDeposit"
                  value={formData.securityDeposit}
                  onChange={handleInputChange}
                  placeholder="e.g. 10000"
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
          
          {/* Room Description */}
          <div>
            <label className="block text-lg font-medium text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe the room..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>
          
          {/* Room Photos */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Room Photos</h3>
            
            <div className="mb-4">
              <label 
                htmlFor="add-photo-upload" 
                className={`flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg h-32 cursor-pointer hover:border-orange-500 transition-colors ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploadingPhoto ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto mb-2"></div>
                    <span className="text-gray-400">Uploading photo...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                    <span className="text-gray-400">Click to upload photo</span>
                  </div>
                )}
                <input 
                  id="add-photo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative group"
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.caption || 'Room photo'} 
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 self-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="p-2 bg-black/60 w-full">
                        <input
                          type="text"
                          placeholder="Add caption (optional)"
                          value={photo.caption || ''}
                          onChange={(e) => {
                            setPhotos(photos.map(p => 
                              p.id === photo.id ? { ...p, caption: e.target.value } : p
                            ));
                          }}
                          className="w-full bg-transparent border-b border-gray-500 text-white text-sm focus:outline-none focus:border-orange-500 px-0 py-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Amenities</h3>
              <div className="space-y-4">
                {Object.entries(getAmenitiesByCategory()).map(([category, categoryAmenities]) => (
                  <div key={category}>
                    <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">{category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {categoryAmenities.map((amenity) => (
                        <div 
                          key={amenity.id}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${formData.amenityIds.includes(amenity.id) ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-gray-700/50 border border-gray-700 hover:bg-gray-700'}`}
                          onClick={() => handleAmenityToggle(amenity.id)}
                        >
                          <span className={`mr-2 flex-shrink-0 rounded-full p-1 ${formData.amenityIds.includes(amenity.id) ? 'text-orange-400' : 'text-gray-400'}`}>
                            {formData.amenityIds.includes(amenity.id) ? (
                              <CheckCircle size={16} />
                            ) : (
                              <div className="w-4 h-4 border-2 border-current rounded-full"></div>
                            )}
                          </span>
                          <span className="text-gray-200 text-sm">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            disabled={formSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Add Room</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Edit Room Modal */}
{isEditModalOpen && selectedRoom && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
      <div className="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">
          Edit Room: {selectedRoom.roomNumber || `Room ${selectedRoom.id}`}
        </h2>
        <button 
          onClick={() => setIsEditModalOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleEditRoom}>
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. A-101"
                  className={`w-full bg-gray-700 border ${formErrors.roomNumber ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.roomNumber && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.roomNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Room Type
                </label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SINGLE_ROOM">Single Room</option>
                  <option value="DOUBLE_ROOM">Double Room</option>
                  <option value="SHARED_2">2-Person Shared</option>
                  <option value="SHARED_3">3-Person Shared</option>
                  <option value="SHARED_4">4-Person Shared</option>
                  <option value="DORMITORY">Dormitory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Floor Number
                </label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. 1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
          
          {/* Beds Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Beds Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Total Beds *
                </label>
                <input
                  type="number"
                  name="totalBeds"
                  value={formData.totalBeds}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full bg-gray-700 border ${formErrors.totalBeds ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.totalBeds && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.totalBeds}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Available Beds *
                </label>
                <input
                  type="number"
                  name="availableBeds"
                  value={formData.availableBeds}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.totalBeds}
                  className={`w-full bg-gray-700 border ${formErrors.availableBeds ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.availableBeds && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.availableBeds}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Monthly Price (₹) *
                </label>
                <input
                  type="number"
                  name="monthlyPrice"
                  value={formData.monthlyPrice}
                  onChange={handleInputChange}
                  placeholder="e.g. 5000"
                  min="0"
                  className={`w-full bg-gray-700 border ${formErrors.monthlyPrice ? 'border-red-500' : 'border-gray-600'} rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {formErrors.monthlyPrice && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.monthlyPrice}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                type="number"
                name="securityDeposit"
                value={formData.securityDeposit}
                onChange={handleInputChange}
                placeholder="e.g. 10000"
                min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
        
        {/* Room Description */}
        <div>
          <label className="block text-lg font-medium text-white mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Describe the room..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          ></textarea>
        </div>
        
        {/* Room Photos */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Room Photos</h3>
          
          <div className="mb-4">
            <label 
              htmlFor="edit-photo-upload" 
              className={`flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg h-32 cursor-pointer hover:border-orange-500 transition-colors ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploadingPhoto ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto mb-2"></div>
                  <span className="text-gray-400">Uploading photo...</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-500" size={24} />
                  <span className="text-gray-400">Click to upload photo</span>
                </div>
              )}
              <input 
                id="edit-photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          
          {photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative group"
                >
                  <img 
                    src={photo.url} 
                    alt={photo.caption || 'Room photo'} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 self-end">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-2 bg-black/60 w-full">
                      <input
                        type="text"
                        placeholder="Add caption (optional)"
                        value={photo.caption || ''}
                        onChange={(e) => {
                          setPhotos(photos.map(p => 
                            p.id === photo.id ? { ...p, caption: e.target.value } : p
                          ));
                        }}
                        className="w-full bg-transparent border-b border-gray-500 text-white text-sm focus:outline-none focus:border-orange-500 px-0 py-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Amenities */}
        {amenities.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Amenities</h3>
            <div className="space-y-4">
              {Object.entries(getAmenitiesByCategory()).map(([category, categoryAmenities]) => (
                <div key={category}>
                  <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryAmenities.map((amenity) => (
                      <div 
                        key={amenity.id}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${formData.amenityIds.includes(amenity.id) ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-gray-700/50 border border-gray-700 hover:bg-gray-700'}`}
                        onClick={() => handleAmenityToggle(amenity.id)}
                      >
                        <span className={`mr-2 flex-shrink-0 rounded-full p-1 ${formData.amenityIds.includes(amenity.id) ? 'text-orange-400' : 'text-gray-400'}`}>
                          {formData.amenityIds.includes(amenity.id) ? (
                            <CheckCircle size={16} />
                          ) : (
                            <div className="w-4 h-4 border-2 border-current rounded-full"></div>
                          )}
                        </span>
                        <span className="text-gray-200 text-sm">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
        <button
          type="button"
          onClick={() => setIsEditModalOpen(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          disabled={formSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          disabled={formSubmitting}
        >
          {formSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  </div>
</div>
)}

{/* Delete Room Confirmation Modal */}
{isDeleteModalOpen && selectedRoom && (
<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
  <div className="bg-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-xl">
    <div className="p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 text-red-500">
        <Trash2 size={24} />
      </div>
      <h3 className="text-xl font-bold text-white text-center mb-2">Delete Room</h3>
      <p className="text-gray-300 text-center mb-6">
        Are you sure you want to delete room <span className="font-semibold text-white">{selectedRoom.roomNumber || `Room ${selectedRoom.id}`}</span>? This action cannot be undone.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsDeleteModalOpen(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          disabled={formSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteRoom}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          disabled={formSubmitting}
        >
          {formSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              <span>Deleting...</span>
            </>
          ) : (
            <>
              <Trash2 size={16} />
              <span>Delete Room</span>
            </>
          )}
        </button>
      </div>
    </div>
  </div>
</div>
)}
</div>
);
};

export default ManageRooms;