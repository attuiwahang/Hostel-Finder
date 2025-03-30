import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const BookingForm = ({ 
  showBookingForm, 
  setShowBookingForm, 
  fetchBookings, 
  fetchBookingStats,
  bookingData,
  isEditing
}) => {
  const initialFormState = {
    userName: '',
    email: '',
    phone: '',
    checkInDate: '',
    duration: 1,
    roomType: 'SINGLE',
    totalAmount: 0,
    paymentStatus: 'PENDING',
    status: 'PENDING',
    notes: ''
  };


  console.log(bookingData)
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomTypes, setRoomTypes] = useState([
    { id: 'SINGLE', name: 'Single Room', price: 6000 },
    { id: 'DOUBLE', name: 'Double Room', price: 9000 },
    { id: 'TRIPLE', name: 'Triple Room', price: 12000 },
    { id: 'QUAD', name: 'Quad Room', price: 15000 }
  ]);

  const token = localStorage.getItem('Token');

  // Reset form when opening/closing
  useEffect(() => {
 
    
    if (showBookingForm) {
      if (isEditing && bookingData) {
        console.log("Setting up edit form with data:", bookingData);
        
        // Format the date to YYYY-MM-DD for the input
        let formattedDate = '';
        
        if (bookingData.checkInDate) {
          try {
            // Handle different date formats
            const dateStr = bookingData.checkInDate.toString();
            
            // For ISO or similar formats with T
            if (dateStr.includes('T')) {
              formattedDate = dateStr.split('T')[0];
            } 
            // For date format like "2020-01-10T00:00:00.000Z"
            else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
              formattedDate = dateStr.substring(0, 10);
            }
            // For other formats, use Date object
            else {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toISOString().split('T')[0];
              }
            }
            
            console.log("Original date:", bookingData.checkInDate);
            console.log("Formatted date for form:", formattedDate);
          } catch (err) {
            console.error("Error formatting date:", err);
          }
        }

        // Create a complete form data object
        const updatedFormData = {
          userName: bookingData.userName || '',
          email: bookingData.email || '',
          phone: bookingData.phone || bookingData.phoneNumber || '',
          checkInDate: formattedDate,
          duration: Number(bookingData.duration) || 1,
          roomType: bookingData.roomType || 'SINGLE',
          totalAmount: Number(bookingData.totalAmount) || 0,
          paymentStatus: bookingData.paymentStatus || 'PENDING',
          status: bookingData.status || 'PENDING',
          notes: bookingData.notes || bookingData.specialRequests || ''
        };
        
        console.log("Setting form data to:", updatedFormData);
        setFormData(updatedFormData);
      } else {
        // Set default check-in date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedTomorrow = tomorrow.toISOString().split('T')[0];
        
        console.log("Setting up new booking form with tomorrow's date:", formattedTomorrow);
        setFormData({
          ...initialFormState,
          checkInDate: formattedTomorrow
        });
      }
    }
  }, [showBookingForm, bookingData, isEditing]);

  // Calculate total amount when duration or room type changes
  useEffect(() => {
    if (formData.roomType && formData.duration) {
      const selectedRoom = roomTypes.find(room => room.id === formData.roomType);
      if (selectedRoom) {
        const total = selectedRoom.price * formData.duration;
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  }, [formData.duration, formData.roomType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing && bookingData) {
        // Update existing booking
        console.log("Updating booking with ID:", bookingData.id);
        console.log("Update data:", formData);
        
        await axios.put(`http://localhost:8870/booking/${bookingData.id}`, {
          userName: formData.userName,
          email: formData.email,
          phoneNumber: formData.phone, // Note: API might expect phoneNumber, not phone
          checkInDate: formData.checkInDate,
          duration: Number(formData.duration),
          roomType: formData.roomType,
          totalAmount: Number(formData.totalAmount),
          paymentStatus: formData.paymentStatus,
          status: formData.status,
          specialRequests: formData.notes // Note: API might expect specialRequests, not notes
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Create new booking - make sure field names match what API expects
        await axios.post('http://localhost:8870/booking', {
          userName: formData.userName,
          email: formData.email,
          phoneNumber: formData.phone,
          checkInDate: formData.checkInDate,
          duration: Number(formData.duration),
          roomType: formData.roomType,
          totalAmount: Number(formData.totalAmount),
          paymentStatus: formData.paymentStatus,
          status: formData.status,
          specialRequests: formData.notes
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      // Refresh bookings and stats
      fetchBookings();
      fetchBookingStats();
      
      // Close form
      setShowBookingForm(false);
      
    } catch (err) {
      console.error("Error saving booking:", err);
      setError(err.response?.data?.message || "An error occurred while saving the booking");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center transition-opacity duration-300 ${
      showBookingForm ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Booking' : 'Add New Booking'}
          </h2>
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowBookingForm(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 p-3 m-4 rounded-lg text-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Guest Name *</label>
              <input 
                type="text" 
                name="userName" 
                value={formData.userName} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Email *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Phone *</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Check-in Date *</label>
              <input 
                type="date" 
                name="checkInDate" 
                value={formData.checkInDate} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Room Type *</label>
              <select 
                name="roomType" 
                value={formData.roomType} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                {roomTypes.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} - ₹{room.price}/month
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Duration (months) *</label>
              <input 
                type="number" 
                name="duration" 
                value={formData.duration} 
                onChange={handleChange}
                min="1"
                max="12"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Total Amount</label>
              <input 
                type="number" 
                name="totalAmount" 
                value={formData.totalAmount} 
                readOnly
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Payment Status</label>
              <select 
                name="paymentStatus" 
                value={formData.paymentStatus} 
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            
            {isEditing && (
              <div>
                <label className="block text-gray-300 mb-1">Booking Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-gray-300 mb-1">Notes</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              rows="3"
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-700">
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={() => setShowBookingForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;