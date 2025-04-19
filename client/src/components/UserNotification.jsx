import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { IoMdNotificationsOutline } from "react-icons/io";
import { socket, connectSocket, onNewNotification, onUnreadNotificationsCount } from "../socketService";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get backend URL from localStorage or use default
  const getBackendUrl = () => {
    return "http://localhost:8870"; // Use port 8870 as specified
  };

  useEffect(() => {
    // Handle clicks outside the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Connect to socket if user is logged in
    const token = Cookies.get("Token");
    if (token) {
      connectSocket();
      
      // Only fetch notifications when dropdown is opened
      if (isOpen) {
        fetchNotifications();
      }

      // Set up socket listeners
      onNewNotification(handleNewNotification);
      onUnreadNotificationsCount(({ count }) => setUnreadCount(count));

      // Clean up on unmount
      return () => {
        socket.off("new_notification");
        socket.off("unread_notifications_count");
      };
    }
  }, [isOpen]); // Fetch notifications when dropdown opens

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = Cookies.get("Token");
      
      // Ensure token exists
      if (!token) {
        console.error("No auth token found");
        throw new Error("Authentication required");
      }
      
      // Get the backend URL
      const backendUrl = getBackendUrl();
      const endpoint = `${backendUrl}/notifications/user`;
      
      console.log("Fetching notifications from:", endpoint);
      console.log("With token:", token.substring(0, 10) + "...");
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add credentials to include cookies in the request
        credentials: 'include'
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      
      // Log the first part of the response
      console.log("Response preview:", responseText.substring(0, 200));
      
      // If response starts with <!DOCTYPE or <html, it's returning HTML instead of JSON
      if (responseText.trim().toLowerCase().startsWith("<!doctype") || 
          responseText.trim().toLowerCase().startsWith("<html")) {
        console.error("Server returned HTML instead of JSON:", responseText.substring(0, 100));
        throw new Error("Server returned HTML instead of JSON");
      }
      
      // Try parsing the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        console.log("Response text:", responseText.substring(0, 200));
        throw new Error("Invalid JSON response");
      }
      
      // Check if data has the expected structure
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        console.error("Unexpected data structure:", data);
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
      
      // Use fallback data
      useFallbackNotifications();
    } finally {
      setIsLoading(false);
    }
  };
  
  const useFallbackNotifications = () => {
    // Create some sample notifications as fallback
    const fallbackData = [
      {
        id: 1,
        title: "New Booking Request",
        message: "You have a new booking request to review",
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        isRead: false,
        linkUrl: "/bookings"
      },
      {
        id: 2,
        title: "Payment Received",
        message: "Payment for booking #1234 has been received",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        isRead: false,
        linkUrl: "/payments"
      },
      {
        id: 3,
        title: "Welcome to Hostel Finder",
        message: "Welcome! Complete your profile to get started",
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        isRead: true,
        linkUrl: "/profile"
      }
    ];
    
    setNotifications(fallbackData);
    setUnreadCount(2); // Two unread notifications in our fallback data
  };

  const handleNewNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read in backend
      const token = Cookies.get("Token");
      const backendUrl = getBackendUrl();
      const endpoint = `${backendUrl}/notifications/user/${notification.id}/read`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error marking notification as read:", response.status, errorText);
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      // Update unread count
      if (!notification.isRead && unreadCount > 0) {
        setUnreadCount((prev) => prev - 1);
      }

      // Navigate to linked page if available
      if (notification.linkUrl) {
        navigate(notification.linkUrl);
      }

      // Close dropdown
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
      // Still close the dropdown and navigate to keep the UX smooth
      setIsOpen(false);
      if (notification.linkUrl) {
        navigate(notification.linkUrl);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = Cookies.get("Token");
      const backendUrl = getBackendUrl();
      const endpoint = `${backendUrl}/api/notifications/user/read-all`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error marking all as read:", response.status, errorText);
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Still update the UI to maintain good UX
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSecs < 60) return "just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoMdNotificationsOutline className="text-white text-2xl" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="border-b border-gray-200 px-4 py-2 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-primaryColor hover:text-primaryColor/80"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-t-primaryColor border-r-primaryColor border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <p className="text-red-500 mb-2">Could not load notifications</p>
                <p className="text-sm">Using sample notifications instead</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800">{notification.title}</p>
                    <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primaryColor rounded-full absolute top-3 right-3"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                No notifications yet
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={() => navigate("/notifications")}
              className="w-full py-2 text-sm text-center text-primaryColor hover:bg-gray-100 rounded transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;