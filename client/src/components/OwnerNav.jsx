import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { RiDashboardLine, RiHotelBedLine, RiCalendarCheckLine } from "react-icons/ri";
import { MdOutlineMeetingRoom, MdOutlineChat } from "react-icons/md";
import { FiUsers, FiSettings, FiLogOut } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const OwnerNav = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get("Token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const info = JSON.parse(localStorage.getItem('info'));

  // Notify parent component when sidebar collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleSignOut = () => {
    Cookies.remove("Token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const menuItems = [
    { 
      title: "Dashboard", 
      icon: <RiDashboardLine className="text-xl" />, 
      path: "/owner-dashboard" 
    },
    { 
      title: "Manage Info", 
      icon: <RiHotelBedLine className="text-xl" />, 
      path: "/info" 
    },
    { 
      title: "Bookings", 
      icon: <RiCalendarCheckLine className="text-xl" />, 
      path: "/manageBookings" 
    },
    { 
      title: "Rooms", 
      icon: <MdOutlineMeetingRoom className="text-xl" />, 
      path: "/rooms" 
    },
    { 
      title: "Staff", 
      icon: <FiUsers className="text-xl" />, 
      path: "/staff" 
    },
    { 
      title: "Chat", 
      icon: <MdOutlineChat className="text-xl" />, 
      path: "/chat" 
    },
    { 
      title: "Settings", 
      icon: <FiSettings className="text-xl" />, 
      path: "/settings" 
    }
  ];

  return (
    <div className={`
      ${isCollapsed ? "w-20" : "w-64"}
      bg-gray-900 text-white h-screen transition-all duration-300 ease-in-out
      flex flex-col fixed left-0 top-0 bottom-0 z-10
    `}>
      {/* Toggle button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-orange-500 text-white rounded-full p-1 z-20"
      >
        {isCollapsed 
          ? <HiChevronRight className="text-sm" /> 
          : <HiChevronLeft className="text-sm" />
        }
      </button>

      {/* Logo and Header */}
      <div className={`flex items-center p-4 h-20 border-b border-gray-800 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <img src={logo} alt="logo" className="h-8" />
        {!isCollapsed && <h2 className="text-white font-semibold ml-2">Hostel Finder</h2>}
      </div>

      {/* User Profile Section */}
      <div className={`py-6 border-b border-gray-800 flex flex-col items-center ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <img
          src="https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg"
          alt="User"
          className="w-12 h-12 rounded-full mb-2"
        />
        {!isCollapsed && (
          <>
            <h3 className="text-sm font-semibold">{info.ownerName}</h3>
            <p className="text-xs text-gray-400">Hostel Owner</p>
          </>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-grow py-4 overflow-y-auto">
        <nav>
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center py-3
                    ${isCollapsed ? 'justify-center px-2' : 'px-4'}
                    ${isActive 
                      ? 'bg-gray-800 text-orange-400 rounded-md border-l-2 border-orange-500' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white rounded-md'
                    } 
                    transition-colors duration-200
                  `}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && <span>{item.title}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Logout Section */}
      <div className={`border-t border-gray-800 p-4 ${isCollapsed ? 'text-center' : ''}`}>
        <button
          onClick={handleSignOut}
          className={`
            text-gray-300 hover:text-white hover:bg-gray-800 
            rounded-md transition-colors duration-200 w-full
            ${isCollapsed ? 'p-2 flex justify-center' : 'flex items-center gap-2 px-4 py-2'}
          `}
        >
          <FiLogOut className={`${isCollapsed ? 'text-xl' : 'mr-2'}`} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default OwnerNav;