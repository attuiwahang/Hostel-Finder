import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Calendar, CheckCircle, AlertCircle, AlertTriangle, Edit, Trash2, Filter } from 'lucide-react';
import OwnerNav from '../components/OwnerNav';
import Topbar from '../components/Topbar';
import BookingForm from '../components/BookingForm'; // Import the separated form component
import axios from 'axios';

const Booking = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const tabs = ['All', 'PENDING', 'CONFIRMED', 'CANCELLED'];
  
  // Handle sidebar collapse state
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };
  
  const token = localStorage.getItem('Token');

  // Booking data state
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState('Last 30 days');
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: '' // success, error, info
  });
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0
  });
  
  // Get booking statistics
  const fetchBookingStats = async () => {
    try {
      const response = await axios.get(`http://localhost:8870/booking/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const statsData = response.data;
      
      // Find counts by status
      const pendingCount = statsData.bookingsByStatus.find(item => item.status === 'PENDING')?.count || 0;
      const confirmedCount = statsData.bookingsByStatus.find(item => item.status === 'CONFIRMED')?.count || 0;
      const cancelledCount = statsData.bookingsByStatus.find(item => item.status === 'CANCELLED')?.count || 0;
      
      // Calculate total revenue
      let totalRevenue = 0;
      if (statsData.recentBookings) {
        totalRevenue = statsData.recentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      }
      
      setStats({
        total: pendingCount + confirmedCount + cancelledCount,
        pending: pendingCount,
        confirmed: confirmedCount,
        cancelled: cancelledCount,
        revenue: totalRevenue
      });
    } catch (err) {
      console.error("Error fetching booking stats:", err);
      showNotification("Failed to load booking statistics", "error");
    }
  };
  
  // Fetch bookings from API
  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Determine if we need to filter by status
      const status = activeTab !== 'All' ? activeTab : '';
      
      // Make API request with pagination and filters
      const response = await axios.get(`http://localhost:8870/booking`, {
        params: {
          status,
          page: currentPage,
          limit
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setBookingsData(response.data.bookings);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
      setLoading(false);
      showNotification("Failed to load bookings", "error");
    }
  };
  
  // Fetch a single booking for editing
  const fetchBookingDetails = async (id) => {
    try {
      console.log("Fetching booking details for ID:", id);
      const response = await axios.get(`http://localhost:8870/booking/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Booking details response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching booking details:", err);
      showNotification("Failed to load booking details", "error");
      return null;
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchBookings();
    fetchBookingStats();
  }, []);
  
  // Refetch when page, tab, or limit changes
  useEffect(() => {
    fetchBookings();
  }, [currentPage, activeTab, limit]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-900/50 text-blue-400 border border-blue-700/30';
      case 'PENDING': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/30';
      case 'CANCELLED': return 'bg-red-900/50 text-red-400 border border-red-700/30';
      default: return 'bg-gray-800 text-gray-400 border border-gray-700';
    }
  };
  
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-900/50 text-green-400 border border-green-700/30';
      case 'PENDING': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/30';
      case 'FAILED': return 'bg-red-900/50 text-red-400 border border-red-700/30';
      default: return 'bg-gray-800 text-gray-400 border border-gray-700';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'PENDING': return <AlertTriangle className="h-4 w-4 mr-1" />;
      case 'CANCELLED': return <X className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };
  
  // Show notification helper
  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = async (id) => {
    try {
      // Make API request to update booking status
      await axios.patch(`http://localhost:8870/booking/${id}/status`, {
        status: 'CANCELLED'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh bookings list
      fetchBookings();
      fetchBookingStats();
      
      // Show success notification
      showNotification('Booking has been cancelled', 'info');
    } catch (err) {
      console.error("Error cancelling booking:", err);
      showNotification('Failed to cancel booking', 'error');
    }
  };
  
  // Handle edit booking
  const handleEditBooking = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8870/booking/singleBooking/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const bookingDetails = response.data.booking;
      
      if (bookingDetails) {
        // Transform the API response to match the form's expected structure
        const formattedBooking = {
          id: bookingDetails.id,
          userName: bookingDetails.user?.userName || bookingDetails.user?.name || "",
          email: bookingDetails.email || bookingDetails.user?.email || "",
          phone: bookingDetails.phoneNumber || "",
          checkInDate: bookingDetails.checkInDate || "",
          duration: bookingDetails.duration || 1,
          roomType: bookingDetails.hostelOwner?.hostelType || "SINGLE",
          totalAmount: bookingDetails.totalAmount || 0,
          paymentStatus: bookingDetails.paymentStatus || "PENDING",
          status: bookingDetails.status || "PENDING",
          notes: bookingDetails.specialRequests || ""
        };
        
        setEditingBooking(formattedBooking);
        setShowBookingForm(true);
      }
    } catch (err) {
      console.error("Error preparing booking for edit:", err);
      showNotification('Failed to prepare booking for editing', 'error');
    }
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Filter bookings based on search query
  const filteredBookings = bookingsData.filter(booking => 
    searchTerm === '' || 
    booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookingNumber?.includes(searchTerm) ||
    booking.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Generate pagination items
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <button 
        key={i}
        className={`w-8 h-8 flex items-center justify-center rounded ${
          currentPage === i ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </button>
    );
  }

  // Handle closing the form and resetting editing state
  const handleCloseForm = () => {
    setShowBookingForm(false);
    setEditingBooking(null);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <OwnerNav onCollapseChange={handleSidebarCollapse} />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar />
        
        {/* Main content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <button 
              className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              onClick={() => {
                setEditingBooking(null);
                setShowBookingForm(true);
              }}
            >
              + Add Booking
            </button>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <select 
                  className="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option>Last 30 days</option>
                  <option>Last 60 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-200 w-full md:w-64"
                />
              </div>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">Total Bookings</h3>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="w-full h-1 bg-blue-600 mt-2 rounded-full"></div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">Pending</h3>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
              <div className="w-full h-1 bg-yellow-500 mt-2 rounded-full"></div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">Confirmed</h3>
              <div className="text-2xl font-bold text-white">{stats.confirmed}</div>
              <div className="w-full h-1 bg-green-600 mt-2 rounded-full"></div>
            </div>
            
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-gray-400 text-sm mb-1">Revenue</h3>
              <div className="text-2xl font-bold text-white">₹{stats.revenue.toLocaleString('en-IN')}</div>
              <div className="w-full h-1 bg-orange-500 mt-2 rounded-full"></div>
            </div>
          </div>
          
          {/* Tabs and Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`py-3 px-6 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'text-orange-400 border-b-2 border-orange-500' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'All' ? tab : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 text-center text-gray-400">
                  Loading bookings...
                </div>
              ) : error ? (
                <div className="py-20 text-center text-red-400">
                  {error}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-700 bg-gray-900/50">
                      <th className="py-3 px-4 font-medium text-gray-300">Booking #</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Guest</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Email</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Check In</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Duration</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Amount</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Status</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Payment</th>
                      <th className="py-3 px-4 font-medium text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                          <td className="py-3 px-4 text-gray-200 font-medium">{booking.id}</td>
                          <td className="py-3 px-4 text-gray-200">{booking.userName}</td>
                          <td className="py-3 px-4 text-gray-200">{booking.email}</td>
                          <td className="py-3 px-4 text-gray-200">{formatDate(booking.checkInDate)}</td>
                          <td className="py-3 px-4 text-gray-200">{booking.duration} months</td>
                          <td className="py-3 px-4 text-gray-200">₹{booking.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs flex items-center w-fit ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs flex items-center w-fit ${getPaymentStatusColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus.charAt(0) + booking.paymentStatus.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {booking.status !== 'CANCELLED' && (
                                <button 
                                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  title="Cancel Booking"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button 
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors" 
                                title="Edit Booking"
                                onClick={() => handleEditBooking(booking.id)}
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-400">
                          No bookings found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            <div className="p-4 flex flex-col md:flex-row justify-between items-center border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-3 md:mb-0">
                Showing {filteredBookings.length} of {total} bookings
              </div>
              <div className="flex gap-2">
                {totalPages > 1 && (
                  <>
                    <button 
                      className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    {paginationItems}
                    <button 
                      className="w-8 h-8 flex items-center justify-center rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* BookingForm Component */}
        <BookingForm 
          showBookingForm={showBookingForm} 
          setShowBookingForm={handleCloseForm} 
          fetchBookings={fetchBookings} 
          fetchBookingStats={fetchBookingStats}
          bookingData={editingBooking}
          isEditing={Boolean(editingBooking)}
        />
        
        {/* Notification */}
        {notification.show && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-800 text-white border border-green-600' :
            notification.type === 'error' ? 'bg-red-800 text-white border border-red-600' :
            'bg-blue-800 text-white border border-blue-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : 
             notification.type === 'error' ? <AlertCircle size={20} /> : 
             <Bell size={20} />}
            <span>{notification.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;