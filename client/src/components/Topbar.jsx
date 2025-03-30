import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiBell, FiUser, FiSettings, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import { RiDashboardLine, RiHotelBedLine, RiCalendarCheckLine } from 'react-icons/ri';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { BsChatDots } from 'react-icons/bs';

const Topbar = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [pageIcon, setPageIcon] = useState(<RiDashboardLine />);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);


  const info = JSON.parse(localStorage.getItem('info'));

  // Sample notifications
  const notifications = [
    { id: 1, message: "New booking request from Sandeep Kumar", time: "10 minutes ago", read: false },
    { id: 2, message: "Room 205 maintenance completed", time: "2 hours ago", read: false },
    { id: 3, message: "Staff meeting scheduled for tomorrow", time: "3 hours ago", read: false },
    { id: 4, message: "Payment received for booking #B-1001", time: "5 hours ago", read: true },
    { id: 5, message: "New message from Priya Singh", time: "Yesterday", read: true }
  ];

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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    setUnreadNotifications(0);
    // In a real app, you would update your notification state/database here
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
        <div className="relative" ref={notificationsRef}>
          <button 
            className="relative text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          >
            <FiBell className="text-xl" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-700">
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
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`border-b border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer p-3 ${notification.read ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-200">{notification.message}</p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-orange-500 ml-2 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <p>No notifications</p>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-700 p-2 text-center">
                <Link to="/notifications" className="text-xs text-orange-400 hover:text-orange-300">
                  View all notifications
                </Link>
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
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-700">
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
                      console.log('Logging out');
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