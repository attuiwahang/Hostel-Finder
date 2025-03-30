import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Eye, X, AlertTriangle, CheckCircle, Calendar, Clock, DollarSign, Tag, MapPin } from 'lucide-react';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [user, setUser] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Get user info from token
  useEffect(() => {
    const token = localStorage.getItem('Token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: decodedToken.id,
          role: decodedToken.role,
          name: decodedToken.name
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
        setError('Authentication error. Please login again.');
      }
    } else {
      setError('You must be logged in to view bookings.');
    }
  }, []);

  // Fetch bookings when user or active tab changes
  useEffect(() => {
    if (!user) return;
    
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('Token');
        const response = await axios.get(`http://localhost:8870/booking/userBookings`, {
          params: {
            status: activeTab !== 'ALL' ? activeTab : undefined
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setBookings(response.data.bookings || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [user, activeTab]);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-gray-700 text-green-400 border border-gray-600';
      case 'PENDING':
        return 'bg-gray-700 text-yellow-400 border border-gray-600';
      case 'CANCELLED':
        return 'bg-gray-700 text-red-400 border border-gray-600';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('Token');
      await axios.patch(`http://localhost:8870/booking/${bookingId}/status`, 
        { status: 'CANCELLED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state to reflect the change
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED' } 
            : booking
        )
      );
      
      // Update selected booking if it's the one being canceled
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  // View booking details
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };
console.log(selectedBooking)
  // Available tabs
  const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6 border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`py-3 px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'text-orange-400 border-b-2 border-orange-500' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          // Empty State
          <div className="text-center py-12 bg-gray-800 rounded-lg shadow border border-gray-700">
            <div className="mx-auto h-16 w-16 text-gray-500 flex items-center justify-center rounded-full bg-gray-700">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">No bookings found</h3>
            <p className="mt-2 text-sm text-gray-400">
              {activeTab === 'ALL' 
                ? "You haven't made any bookings yet." 
                : `You don't have any ${activeTab.toLowerCase()} bookings.`}
            </p>
            <button 
              onClick={() => window.location.href = '/hostels'}
              className="mt-6 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
            >
              Browse Hostels
            </button>
          </div>
        ) : (
          // Bookings Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {booking.hostelOwner?.hostelName || "Unknown Hostel"}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs flex items-center ${getStatusClass(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status?.charAt(0) + booking.status?.slice(1).toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">Check In: {formatDate(booking.checkInDate)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-300">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">Duration: {booking.duration} {booking.duration === 1 ? 'month' : 'months'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-300">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="text-sm">Amount: ₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                    <span className="text-xs text-gray-400">#{booking.bookingNumber}</span>
                    <div className="space-x-2">
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="px-3 py-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-800/50 rounded border border-red-800/50"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={() => viewBookingDetails(booking)}
                        className="px-3 py-1 text-xs bg-gray-700 text-white hover:bg-gray-600 rounded border border-gray-600"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h2 className="text-xl font-semibold text-white">Booking Details</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Hostel Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedBooking.hostelOwner?.hostelName || "Unknown Hostel"}</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <p className="text-gray-300">
                    {selectedBooking.hostelOwner?.address || selectedBooking.hostelOwner?.location || "Address not available"}
                  </p>
                </div>
              </div>
              
              {/* Status Banner */}
              <div className={`p-3 rounded-md ${
                selectedBooking.status === 'CONFIRMED' ? 'bg-green-900/20 text-green-400 border border-green-900/30' :
                selectedBooking.status === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/30' :
                selectedBooking.status === 'CANCELLED' ? 'bg-red-900/20 text-red-400 border border-red-900/30' :
                'bg-gray-700 text-gray-300'
              }`}>
                <div className="flex items-center">
                  {getStatusIcon(selectedBooking.status)}
                  <span className="font-medium">
                    {selectedBooking.status === 'CONFIRMED' && 'Your booking is confirmed'}
                    {selectedBooking.status === 'PENDING' && 'Your booking is pending confirmation'}
                    {selectedBooking.status === 'CANCELLED' && 'This booking has been cancelled'}
                  </span>
                </div>
              </div>
              
              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-md border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Booking Information</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between">
                      <span className="text-gray-400">Booking Number</span>
                      <span className="text-white font-medium">#{selectedBooking.bookingNumber}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Check-in Date</span>
                      <span className="text-white">{formatDate(selectedBooking.checkInDate)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="text-white">{selectedBooking.duration} {selectedBooking.duration === 1 ? 'month' : 'months'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Room Type</span>
                      <span className="text-white">{selectedBooking.roomType || "Not specified"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Date Booked</span>
                      <span className="text-white">{formatDate(selectedBooking.createdAt)}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-md border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Information</h4>
                  <ul className="space-y-3">
                    <li className="flex justify-between">
                      <span className="text-gray-400">Payment Status</span>
                      <span className={`${
                        selectedBooking.paymentStatus === 'CONFIRMED' ? 'text-green-400' :
                        selectedBooking.paymentStatus === 'PENDING' ? 'text-yellow-400' :
                        selectedBooking.paymentStatus === 'FAILED' ? 'text-red-400' :
                        'text-white'
                      } font-medium`}>
                        {selectedBooking.paymentStatus?.charAt(0) + selectedBooking.paymentStatus?.slice(1).toLowerCase()}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="text-white font-medium">₹{selectedBooking.totalAmount?.toLocaleString('en-IN')}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">Price/Month</span>
                      <span className="text-white">₹{(selectedBooking.totalAmount / selectedBooking.duration).toLocaleString('en-IN')}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Additional Information */}
              {selectedBooking.notes && (
                <div className="bg-gray-700/50 p-4 rounded-md border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Additional Notes</h4>
                  <p className="text-white">{selectedBooking.notes}</p>
                </div>
              )}
              
              {/* Contact Information */}
              <div className="bg-gray-700/50 p-4 rounded-md border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Contact Information</h4>
                {selectedBooking.hostelOwner?.contact && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Hostel Phone</span>
                    <a href={`tel:${selectedBooking.hostelOwner.contact}`} className="text-blue-400 hover:underline">
                      {selectedBooking.hostelOwner.contact}
                    </a>
                  </div>
                )}
                {selectedBooking.hostelOwner?.email && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">Hostel Email</span>
                    <a href={`mailto:${selectedBooking.hostelOwner.email}`} className="text-blue-400 hover:underline">
                      {selectedBooking.hostelOwner.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-700 p-4 flex justify-end space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 text-white hover:bg-gray-600 rounded-md"
              >
                Close
              </button>
              {selectedBooking.status === 'PENDING' && (
                <button
                  onClick={() => {
                    cancelBooking(selectedBooking.id);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;