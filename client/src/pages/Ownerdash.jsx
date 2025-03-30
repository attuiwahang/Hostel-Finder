import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OwnerSidebar from '../components/OwnerNav';
import Topbar from '../components/Topbar';
import { FiUsers, FiDollarSign, FiArrowUp, FiArrowDown, FiTrendingUp } from 'react-icons/fi';
import { RiHotelBedLine, RiCalendarCheckLine } from 'react-icons/ri';
import { MdOutlineMeetingRoom } from 'react-icons/md';

const OwnerDash = () => {
  // State to track sidebar collapse status
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // States for dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to handle sidebar collapse state changes
  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  // Get user info from token
  const getUserInfo = () => {
    const token = localStorage.getItem('Token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        return {
          id: decodedToken.id,
          role: decodedToken.role,
          name: decodedToken.name
        };
      } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
      }
    }
    return null;
  };



  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const user = getUserInfo();
        console.log(user)

        const token = localStorage.getItem('Token');
        
        // Fetch main dashboard stats
        const statsResponse = await axios.get(`/api/dashboard/hostel-owner/${user.id}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Fetch occupancy details
        const occupancyResponse = await axios.get(`/api/dashboard/hostel-owner/${user.id}/occupancy`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Set dashboard data
        if (statsResponse.data.success) {
          setDashboardStats(statsResponse.data.data);
          setRecentBookings(statsResponse.data.data.bookings.recent || []);
          setNotifications(statsResponse.data.data.notifications?.unread || 0);
        }
        
        // Set room status data
        if (occupancyResponse.data.success) {
          const roomTypeDistribution = occupancyResponse.data.data.occupancy.roomTypeDistribution || [];
          const roomData = occupancyResponse.data.data.rooms || [];
          
          // Transform room data for the UI
          const transformedRoomStatus = [];
          const roomTypeMap = {};
          
          roomData.forEach(room => {
            if (!roomTypeMap[room.roomType]) {
              roomTypeMap[room.roomType] = {
                type: room.roomType,
                total: 0,
                occupied: 0,
                available: 0,
                maintenance: 0
              };
            }
            
            roomTypeMap[room.roomType].total += 1;
            roomTypeMap[room.roomType].occupied += (room.totalBeds - room.availableBeds);
            roomTypeMap[room.roomType].available += room.availableBeds;
          });
          
          Object.values(roomTypeMap).forEach(roomType => {
            transformedRoomStatus.push(roomType);
          });
          
          setRoomStatus(transformedRoomStatus);
        }
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format numbers for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous) return { value: "0%", isIncrease: false };
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: `${Math.abs(change).toFixed(1)}%`,
      isIncrease: change >= 0
    };
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Prepare stats cards data
  const getStatsCards = () => {
    if (!dashboardStats) return [];
    
    const currentMonthRevenue = dashboardStats.revenue.currentMonth || 0;
    const prevMonthRevenue = dashboardStats.revenue.previousMonth || 0;
    const revenueChange = calculateChange(currentMonthRevenue, prevMonthRevenue);
    
    const totalBookings = dashboardStats.bookings.total || 0;
    const pendingBookings = dashboardStats.bookings.pending || 0;
    
    const occupancyRate = dashboardStats.occupancy.occupancyRate || 0;
    
    return [
      { 
        title: "Total Bookings", 
        value: totalBookings.toString(), 
        icon: <RiCalendarCheckLine />, 
        change: `${revenueChange.value}`,
        isIncrease: revenueChange.isIncrease,
        bgColor: "bg-gray-800"
      },
      { 
        title: "Monthly Revenue", 
        value: formatCurrency(currentMonthRevenue), 
        icon: <FiDollarSign />, 
        change: `${revenueChange.value}`,
        isIncrease: revenueChange.isIncrease,
        bgColor: "bg-gray-800"
      },
      { 
        title: "Occupancy Rate", 
        value: `${occupancyRate.toFixed(1)}%`, 
        icon: <MdOutlineMeetingRoom />, 
        change: "0%",
        isIncrease: true,
        bgColor: "bg-gray-800"
      },
      { 
        title: "Pending Bookings", 
        value: pendingBookings.toString(), 
        icon: <FiUsers />, 
        change: "0%",
        isIncrease: true,
        bgColor: "bg-gray-800"
      }
    ];
  };

  // Format bookings for display
  const formatBookingsForDisplay = (bookings) => {
    return bookings.map(booking => ({
      id: booking.id,
      guest: booking.userName,
      room: booking.bookingRooms?.length > 0 ? `Room ${booking.bookingRooms[0].room.roomNumber}` : "Not assigned",
      checkIn: formatDate(booking.checkInDate),
      checkOut: formatDate(new Date(new Date(booking.checkInDate).setMonth(new Date(booking.checkInDate).getMonth() + booking.duration))),
      amount: formatCurrency(booking.totalAmount),
      status: booking.status.charAt(0) + booking.status.slice(1).toLowerCase()
    }));
  };

  // Get the stats cards data
  const stats = getStatsCards();

  // Prepare notifications
  const getNotificationsText = () => {
    if (dashboardStats?.notifications?.unread > 0) {
      return [
        { id: 1, message: `You have ${dashboardStats.notifications.unread} unread notifications`, time: "Check your notifications panel" }
      ];
    }
    return [{ id: 1, message: "No new notifications", time: "You're all caught up!" }];
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <OwnerSidebar onCollapseChange={handleSidebarCollapse} />
        <div className={`flex-1 flex items-center justify-center transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <OwnerSidebar onCollapseChange={handleSidebarCollapse} />
        <div className={`flex-1 flex items-center justify-center transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="text-red-500 bg-red-900/20 p-4 rounded-md border border-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <OwnerSidebar onCollapseChange={handleSidebarCollapse} />
      
      <div 
        className={`flex-1 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Use the Topbar component */}
        <Topbar />
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {stats.map((stat, index) => (
              <div key={index} className={`${stat.bgColor} rounded-lg border border-gray-700 shadow-md p-4 text-white`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-gray-300 mb-1">{stat.title}</h2>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-full bg-orange-500/20 text-orange-400">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  {stat.isIncrease ? 
                    <FiArrowUp className={`mr-1 ${stat.isIncrease ? 'text-green-400' : 'text-red-400'}`} /> : 
                    <FiArrowDown className={`mr-1 ${stat.isIncrease ? 'text-green-400' : 'text-red-400'}`} />
                  }
                  <span className={stat.isIncrease ? 'text-green-400' : 'text-red-400'}>{stat.change}</span>
                  <span className="text-gray-400 ml-1">from last month</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Bookings */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-base font-semibold text-white">Recent Bookings</h2>
                <button className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                  View All
                </button>
              </div>
              <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Check-In
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-700/30">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {booking.userName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(booking.checkInDate)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                            {booking.duration} {booking.duration === 1 ? 'month' : 'months'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-200">
                            {formatCurrency(booking.totalAmount)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              booking.status === 'CONFIRMED' ? 'bg-green-900/50 text-green-400 border border-green-700/30' :
                              booking.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/30' :
                              booking.status === 'CANCELLED' ? 'bg-red-900/50 text-red-400 border border-red-700/30' :
                              'bg-gray-900/50 text-gray-400 border border-gray-700/30'
                            }`}>
                              {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-gray-400">
                          No recent bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Right Side Panels */}
            <div className="space-y-4">
              {/* Notifications */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-base font-semibold text-white">Notifications</h2>
                  {dashboardStats?.notifications?.unread > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {dashboardStats.notifications.unread}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-700 max-h-[150px] overflow-y-auto">
                  {getNotificationsText().map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-700/30">
                      <p className="text-sm text-gray-200">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-700/30 text-center">
                  <button className="text-orange-400 hover:text-orange-300 text-sm font-medium">
                    View All Notifications
                  </button>
                </div>
              </div>
              
              {/* Room Status */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <h2 className="text-base font-semibold text-white">Room Status</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {roomStatus.length > 0 ? (
                      roomStatus.map((type, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-medium text-gray-300">{type.type} Rooms</h3>
                            <span className="text-xs text-gray-400">{type.occupied}/{type.total} occupied</span>
                          </div>
                          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500" 
                              style={{ width: `${(type.occupied / type.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-gray-400">
                            <span>{type.available} Available</span>
                            <span>{type.maintenance || 0} In Maintenance</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2 text-gray-400">No room data available</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Revenue Trend */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <h2 className="text-base font-semibold text-white">Monthly Revenue</h2>
                </div>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mr-4">
                      <FiTrendingUp className="text-orange-400 text-xl" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">This Month</p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(dashboardStats?.revenue?.currentMonth || 0)}
                      </p>
                      <p className="text-xs text-green-400 flex items-center">
                        {dashboardStats?.revenue?.percentChange >= 0 ? (
                          <><FiArrowUp className="mr-1" /> {dashboardStats?.revenue?.percentChange.toFixed(1)}% from last month</>
                        ) : (
                          <><FiArrowDown className="mr-1" /> {Math.abs(dashboardStats?.revenue?.percentChange).toFixed(1)}% from last month</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDash;