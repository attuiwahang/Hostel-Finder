import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import logo from "../assets/logo.png";
import notification from "../assets/notification.png";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { IoIosNotifications } from "react-icons/io";
import { CiLogout } from "react-icons/ci";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("Token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    Cookies.remove("Token");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    navigate("/");
  };

  return (
    <div className="h-20 bg-backgroundColor flex justify-between items-center px-16">
      <div className="flex items-center gap-2">
        <img src={logo} alt="logo" />
        <h2 className="text-[#F9F9FF]">Hostel Finder</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex gap-6 text-[#F9F9FF]">
          <Link to="/">Home</Link>
          <Link to="/hostels">Hostels</Link>
          <Link to="/Booking">Booking</Link>
          <Link to="/AboutUs">About Us</Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              <img
                src={notification}
                alt="notification"
                className="h-4 w-4 cursor-pointer"
              />
              <div className="relative">
                <img
                  src="https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg"
                  alt="User"
                  className="w-8 h-8 rounded-full cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48  bg-red-700 rounded-md shadow-lg "
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <div className="py-2 px-3 hover:bg-gray-100 cursor-pointer bg-white flex gap-2 items-center">
                    <CiLogout  className="text-gray-600 font-bold"/>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left text-sm text-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <NavLink to="/login">
              <button className="bg-primaryColor px-4 py-1 text-[#F9F9FF] rounded">
                Log in
              </button>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;