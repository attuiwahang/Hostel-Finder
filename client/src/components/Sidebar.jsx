import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ activePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'bookings', label: 'Bookings', path: '/bookings' },
    { id: 'staffs', label: 'Staffs', path: '/staffs' },
    { id: 'rooms', label: 'Rooms', path: '/rooms' },
    { id: 'chats', label: 'Chats', path: '/chats' },
  ];

  return (
    <div className="w-48 h-screen bg-gray-900 text-white p-4">
      <div className="flex items-center mb-8 pl-2">
        <span className="text-orange-400 mr-2">🏨</span>
        <h1 className="text-xl font-semibold">Hostel Fir</h1>
      </div>
      
      <nav>
        {menuItems.map((item) => (
          <Link 
            key={item.id}
            to={item.path}
            className={`block py-3 px-4 mb-2 rounded-md transition-colors ${
              activePage === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;