import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiBell, FiUser, FiSettings, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import { RiDashboardLine, RiHotelBedLine, RiCalendarCheckLine } from 'react-icons/ri';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';
import { socket, connectSocket } from '../socketService'; 

const Topbar = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [pageIcon, setPageIcon] = useState(<RiDashboardLine />);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const info = JSON.parse(localStorage.getItem('info'));

  // Page mapping for dynamic title and icon
  const pageMap = {
    '/': { title: 'Dashboard', icon: <RiDashboardLine /> },
    '/dashboard': { title: 'Dashboard', icon: <RiDashboardLine /> },
    '/hostels': { title: 'My Hostels', icon: <RiHotelBedLine /> },
    '/bookings': { title: 'Bookings', icon: <RiCalendarCheckLine /> },
    '/rooms': { title: 'Rooms', icon: <MdOutlineMeetingRoom /> },
    '/staff': { title: 'Staff Management', icon: <FaUsers /> },
    '/chat': { title: 'Messages', icon: <BsChatDots /> },
    '/settings': { title: 'Settings', icon: <FiSettings /> },
  };

  // Get backend URL
  const getBackendUrl = () => {
    return "http://localhost:8870"; // Use port 8870 as specified
  };

  // Update page title based on current path
  useEffect(() => {
    const path = location.pathname;
    const currentPage = pageMap[path] || { title: 'Dashboard', icon: <RiDashboardLine /> };
    setPageTitle(currentPage.title);
    setPageIcon(currentPage.icon);
    
    // Close dropdowns when changing pages
    setIsProfileDropdownOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && 
          !notificationsRef.current.contains(event.target) &&
          !notificationButtonRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize socket connection and fetch notifications
  useEffect(() => {
    // Connect to socket
    connectSocket();
    
    // Set up socket listener for new notifications
    socket.on('new_notification', handleNewNotification);
    socket.on('unread_notifications_count', ({ count }) => setUnreadNotifications(count));
    
    // Clean up on unmount
    return () => {
      socket.off('new_notification');
      socket.off('unread_notifications_count');
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications();
    }
  }, [isNotificationsOpen]);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      // Try to fetch from API
      const token = localStorage.getItem('Token');
      const backendUrl = getBackendUrl();
      
      const response = await fetch(`${backendUrl}/notifications/hostel-owner?limit=8`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      }); 
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadNotifications(data.unreadCount);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
      // Fallback to sample data if API fails
      const currentTime = new Date();
      
      // Generate dynamic timestamps
      const tenMinutesAgo = new Date(currentTime - 10 * 60000).toISOString();
      const twoHoursAgo = new Date(currentTime - 2 * 3600000).toISOString();
      const threeHoursAgo = new Date(currentTime - 3 * 3600000).toISOString();
      const fiveHoursAgo = new Date(currentTime - 5 * 3600000).toISOString();
      const yesterday = new Date(currentTime - 24 * 3600000).toISOString();
      
      setNotifications([
        { 
          id: 1, 
          message: "New booking request from Sandeep Kumar", 
          createdAt: tenMinutesAgo,
          read: false,
          type: 'BOOKING',
          linkUrl: '/bookings'
        },
        { 
          id: 2, 
          message: "Room 205 maintenance completed", 
          createdAt: twoHoursAgo,
          read: false,
          type: 'MAINTENANCE',
          linkUrl: '/rooms'
        },
        { 
          id: 3, 
          message: "Staff meeting scheduled for tomorrow", 
          createdAt: threeHoursAgo,
          read: false,
          type: 'SYSTEM',
          linkUrl: '/staff'
        },
        { 
          id: 4, 
          message: "Payment received for booking #B-1001", 
          createdAt: fiveHoursAgo,
          read: true,
          type: 'PAYMENT',
          linkUrl: '/bookings'
        },
        { 
          id: 5, 
          message: "New message from Priya Singh", 
          createdAt: yesterday,
          read: true,
          type: 'MESSAGE',
          linkUrl: '/chat'
        }
      ]);
      setUnreadNotifications(3);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNewNotification = (notification) => {
    // Add new notification to the top of the list
    setNotifications(prev => [notification, ...prev.slice(0, 7)]);
    
    // Increase unread count
    setUnreadNotifications(prev => prev + 1);
    
    // Play notification sound (optional)
    playNotificationSound();
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      // Audio failed to play, just continue silently
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // Try to update in API
      const token = localStorage.getItem('token');
      const backendUrl = getBackendUrl();
      
      await fetch(`${backendUrl}/api/notifications/hostel-owner/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
    
    // Update local state regardless of API success
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    
    // Update unread count
    const unreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
    setUnreadNotifications(unreadCount);
  };

  const markAllAsRead = async () => {
    try {
      // Try to update in API
      const token = localStorage.getItem('token');
      const backendUrl = getBackendUrl();
      
      await fetch(`${backendUrl}/api/notifications/hostel-owner/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });
    } catch (error) {
      console.log('Error marking all notifications as read:', error);
    }
    
    // Update local state regardless of API success
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadNotifications(0);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    
    // If there's a link to navigate to, it will be handled by the Link component
    // Close the dropdown
    setIsNotificationsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const secondsAgo = Math.floor((now - date) / 1000);
    
    if (secondsAgo < 60) {
      return 'Just now';
    }
    
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
      return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    }
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
    }
    
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 7) {
      return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    }
    
    // If more than 7 days, show the actual date
    return date.toLocaleDateString();
  };

  // Get notification icon/color based on its type
  const getNotificationIndicator = (type) => {
    switch (type) {
      case 'BOOKING':
        return 'bg-blue-500';
      case 'PAYMENT':
        return 'bg-green-500';
      case 'MAINTENANCE':
        return 'bg-yellow-500';
      case 'MESSAGE':
        return 'bg-pink-500';
      case 'SYSTEM':
        return 'bg-purple-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <div className="bg-gray-800 shadow-md px-6 py-4 border-b border-gray-700 flex justify-between items-center">
      {/* Left side - Page title */}
      <div className="flex items-center">
        <span className="text-orange-400 mr-3 text-xl">{pageIcon}</span>
        <h1 className="text-xl font-bold text-white">{pageTitle}</h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            ref={notificationButtonRef}
            className="relative text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
          >
            <FiBell className="text-xl" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown - Fixed positioning to prevent cutoff */}
          {isNotificationsOpen && (
            <div 
              ref={notificationsRef}
              className="fixed right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-700"
              style={{
                top: 'auto',
                right: '1.5rem', // Adjusted position
                maxHeight: 'calc(100vh - 130px)', // Prevent overflowing the viewport
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 bg-gray-900">
                <h3 className="font-medium text-white">Notifications</h3>
                {unreadNotifications > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-orange-400 hover:text-orange-300"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                {notificationsLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-t-orange-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p>Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map(notification => (
                    <Link 
                      to={notification.linkUrl || '#'} 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer p-3 block ${notification.read ? 'opacity-75' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex">
                          <span className={`h-2 w-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${getNotificationIndicator(notification.type)}`}></span>
                          <p className="text-sm text-gray-200">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-orange-500 ml-2 mt-1.5 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-4">{formatTimeAgo(notification.createdAt)}</p>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="text-gray-300 hover:text-white transition-colors">
          <FiHelpCircle className="text-xl" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <img 
              src="https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg" 
              alt="User" 
              className="h-8 w-8 rounded-full border-2 border-gray-600"
            />
            <span className="hidden md:block font-medium text-gray-200">{info.ownerName}</span>
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-700">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">{info.ownerName}</p>
                  <p className="text-xs text-gray-400">{info.email}</p>
                </div>
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                  <FiUser className="mr-2" /> Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                  <FiSettings className="mr-2" /> Settings
                </Link>
                <div className="border-t border-gray-700 mt-1 pt-1">
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center"
                    onClick={() => {
                      // Handle logout functionality here
                      localStorage.removeItem('token');
                      localStorage.removeItem('info');
                      window.location.href = '/login';
                    }}
                  >
                    <FiLogOut className="mr-2" /> Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;