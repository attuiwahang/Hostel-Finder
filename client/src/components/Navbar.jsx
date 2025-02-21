import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import logo from "../assets/logo.png";
import notification from "../assets/notification.png";
import { Link, NavLink } from "react-router-dom";
import { IoIosNotifications } from "react-icons/io";

const Navbar = () => {
 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get("Token");
    if (token) {
      
      setIsLoggedIn(true);
    }
  }, []);

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
          <Link to="/bookings">Bookings</Link>
          <Link to="/about">About Us</Link>

          {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <img src={notification} alt="notification" className="h-4 w-4 cursor-pointer" />
            <img
              src="https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg"
              alt="User"
              className="w-8 h-8 rounded-full"
            />
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
