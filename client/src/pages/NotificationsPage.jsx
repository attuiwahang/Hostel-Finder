import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { IoChevronBack } from "react-icons/io5";
import { MdDeleteOutline, MdNotifications, MdCheck, MdDeleteSweep } from "react-icons/md";
import { FiRefreshCw } from "react-icons/fi";
import { socket, connectSocket, onNewNotification } from "../socketService";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'unread', 'read'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const navigate = useNavigate();

  // Get backend URL
  const getBackendUrl = () => {
    return "http://localhost:8870"; // Use port 8870 as specified
  };

  useEffect(() => {
    document.title = "Notifications | Hostel Finder";
    
    // Connect to socket if needed
    connectSocket();
    
    // Listen for new notifications
    onNewNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    
    // Fetch notifications
    fetchNotifications();
    
    // Clean up
    return () => {
      socket.off("new_notification");
    };
  }, []);

  useEffect(() => {
    // Refetch when tab or page changes
    fetchNotifications();
  }, [activeTab, pagination.currentPage]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = Cookies.get("Token");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const isReadQuery = activeTab === "unread" ? "false" : activeTab === "read" ? "true" : "";
      const backendUrl = getBackendUrl();
      
      const url = `${backendUrl}/notifications/user?page=${pagination.currentPage}&limit=10${isReadQuery ? `&isRead=${isReadQuery}` : ""}`;
      
      console.log("Fetching notifications from:", url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      
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
        throw new Error("Invalid JSON response");
      }
      
      if (data.notifications) {
        setNotifications(data.notifications);
        setPagination({
          currentPage: data.pagination.page,
          totalPages: data.pagination.totalPages,
        });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
      
      // Use fallback data
      useFallbackNotifications();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackNotifications = () => {
    // Create some sample notifications as fallback
    const currentTime = new Date();
    
    const fallbackData = [
      {
        id: 1,
        title: "New Booking Request",
        message: "You have a new booking request to review from a guest staying 7 nights",
        createdAt: new Date(currentTime - 30 * 60000).toISOString(),
        isRead: false,
        type: "BOOKING",
        linkUrl: "/bookings"
      },
      {
        id: 2,
        title: "Payment Received",
        message: "Payment of $150 for booking #1234 has been successfully processed",
        createdAt: new Date(currentTime - 2 * 3600000).toISOString(),
        isRead: false,
        type: "PAYMENT",
        linkUrl: "/payments"
      },
      {
        id: 3,
        title: "Welcome to Hostel Finder",
        message: "Welcome to Hostel Finder! Complete your profile to get the most out of our platform.",
        createdAt: new Date(currentTime - 24 * 3600000).toISOString(),
        isRead: true,
        type: "SYSTEM",
        linkUrl: "/profile"
      },
      {
        id: 4,
        title: "New Review",
        message: "A guest has left a 5-star review for your property. Check it out!",
        createdAt: new Date(currentTime - 3 * 24 * 3600000).toISOString(),
        isRead: true,
        type: "REVIEW",
        linkUrl: "/reviews"
      },
      {
        id: 5,
        title: "Message from Support",
        message: "Our team has responded to your recent inquiry about payment processing.",
        createdAt: new Date(currentTime - 5 * 24 * 3600000).toISOString(),
        isRead: true,
        type: "MESSAGE",
        linkUrl: "/messages"
      }
    ];
    
    setNotifications(fallbackData);
    setPagination({
      currentPage: 1,
      totalPages: 1
    });
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        const token = Cookies.get("Token");
        const backendUrl = getBackendUrl();
        
        await fetch(`${backendUrl}/notifications/user/${notification.id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include'
        });

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      // Navigate to linked page if available
      if (notification.linkUrl) {
        navigate(notification.linkUrl);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = Cookies.get("Token");
      const backendUrl = getBackendUrl();
      
      await fetch(`${backendUrl}/notifications/user/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      // Update local state - mark all as read
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      // Refetch to ensure our UI is in sync with backend
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent the notification click handler
    
    try {
      const token = Cookies.get("Token");
      const backendUrl = getBackendUrl();
      
      await fetch(`${backendUrl}/notifications/user/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      // Remove from local state
      setNotifications((prev) => 
        prev.filter((n) => n.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearReadNotifications = async () => {
    try {
      const token = Cookies.get("Token");
      const backendUrl = getBackendUrl();
      
      await fetch(`${backendUrl}/api/notifications/user/read`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });

      // Remove read notifications from local state
      setNotifications((prev) => 
        prev.filter((n) => !n.isRead)
      );
      
      // If we're on the "read" tab, we should refetch
      if (activeTab === "read") {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error clearing read notifications:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  // Get notification type color based on type
  const getNotificationTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'BOOKING':
        return 'bg-blue-500';
      case 'PAYMENT':
        return 'bg-green-500';
      case 'SYSTEM':
        return 'bg-purple-500';
      case 'MESSAGE':
        return 'bg-pink-500';
      case 'REVIEW':
        return 'bg-yellow-500';
      case 'MAINTENANCE':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'BOOKING':
        return <span className="text-blue-500 text-xs font-medium">Booking</span>;
      case 'PAYMENT':
        return <span className="text-green-500 text-xs font-medium">Payment</span>;
      case 'SYSTEM':
        return <span className="text-purple-500 text-xs font-medium">System</span>;
      case 'MESSAGE':
        return <span className="text-pink-500 text-xs font-medium">Message</span>;
      case 'REVIEW':
        return <span className="text-yellow-500 text-xs font-medium">Review</span>;
      case 'MAINTENANCE':
        return <span className="text-orange-500 text-xs font-medium">Maintenance</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Go back"
          >
            <IoChevronBack className="text-2xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-primaryColor rounded-full focus:outline-none"
          aria-label="Refresh notifications"
        >
          <FiRefreshCw className={`text-xl ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs and actions */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4">
          <div className="flex space-x-4 border-b border-gray-200 w-full md:w-auto md:border-b-0">
            <button
              className={`pb-2 px-3 flex items-center space-x-1 ${
                activeTab === "all"
                  ? "border-b-2 border-primaryColor text-primaryColor font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("all")}
            >
              <MdNotifications className={activeTab === "all" ? "text-primaryColor" : "text-gray-500"} />
              <span>All</span>
            </button>
            <button
              className={`pb-2 px-3 flex items-center space-x-1 ${
                activeTab === "unread"
                  ? "border-b-2 border-primaryColor text-primaryColor font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("unread")}
            >
              <span className={`relative flex h-2 w-2 ${activeTab === "unread" ? "opacity-100" : "opacity-50"}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primaryColor opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primaryColor"></span>
              </span>
              <span>Unread</span>
            </button>
            <button
              className={`pb-2 px-3 flex items-center space-x-1 ${
                activeTab === "read"
                  ? "border-b-2 border-primaryColor text-primaryColor font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab("read")}
            >
              <MdCheck className={activeTab === "read" ? "text-primaryColor" : "text-gray-500"} />
              <span>Read</span>
            </button>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
            >
              <MdCheck className="mr-1" /> Mark all as read
            </button>
            <button
              onClick={handleClearReadNotifications}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
            >
              <MdDeleteSweep className="mr-1" /> Clear read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryColor mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Error loading notifications</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Using sample notifications instead</p>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`h-3 w-3 mt-1.5 rounded-full mr-3 flex-shrink-0 ${getNotificationTypeColor(notification.type)}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-gray-800">
                          {notification.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                          title="Delete notification"
                        >
                          <MdDeleteOutline className="text-xl" />
                        </button>
                      </div>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <span className="bg-primaryColor text-white text-xs px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center py-4 border-t border-gray-100">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      pagination.currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(pagination.totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => handlePageChange(page + 1)}
                      className={`px-3 py-1 rounded ${
                        pagination.currentPage === page + 1
                          ? "bg-primaryColor text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-3 py-1 rounded ${
                      pagination.currentPage === pagination.totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="text-gray-400 mb-4">
              <MdNotifications className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-gray-500">No notifications found</p>
            {activeTab !== "all" && (
              <button
                onClick={() => setActiveTab("all")}
                className="mt-2 text-primaryColor hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;