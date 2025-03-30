import React from 'react';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // Sample data for the revenue chart
  const revenueData = [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 10000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 13000 },
    { month: 'May', value: 18000 },
    { month: 'Jun', value: 22000 },
    { month: 'Jul', value: 19000 },
    { month: 'Aug', value: 23000 },
    { month: 'Sep', value: 20000 },
  ];

  // Sample data for recent bookings
  const recentBookings = [
    { id: 1, name: 'John Smith', checkIn: '10 Mar', checkOut: '15 Mar', roomType: 'Deluxe', status: 'Paid' },
    { id: 2, name: 'Maria Garcia', checkIn: '09 Mar', checkOut: '12 Mar', roomType: 'Standard', status: 'Pending' },
    { id: 3, name: 'Robert Chen', checkIn: '08 Mar', checkOut: '10 Mar', roomType: 'Premium', status: 'Paid' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage="dashboard" />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
              <p className="text-gray-500">Welcome back, Admin</p>
            </div>
            <div>
              <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 30 days</option>
                <option>Last 60 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Total Revenue Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Total Revenue</h3>
              <div className="text-3xl font-bold text-gray-800 mb-2">$28,650</div>
              <div className="text-green-500 text-sm">↑ 12.3% from last month</div>
            </div>
            
            {/* Occupancy Rate Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Occupancy Rate</h3>
              <div className="text-3xl font-bold text-gray-800 mb-2">78.5%</div>
              <div className="text-red-500 text-sm">↓ 2.7% from last month</div>
            </div>
            
            {/* Total Bookings Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Total Bookings</h3>
              <div className="text-3xl font-bold text-gray-800 mb-2">248</div>
              <div className="text-green-500 text-sm">↑ 5.1% from last month</div>
            </div>
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Revenue Overview Chart */}
            <div className="bg-white p-6 rounded-lg shadow col-span-2">
              <h3 className="text-gray-700 font-semibold mb-4">Revenue Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <Line type="monotone" dataKey="value" stroke="#4F86E6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4">
                {revenueData.map((item) => (
                  <div key={item.month} className="text-xs text-gray-500">{item.month}</div>
                ))}
              </div>
            </div>
            
            {/* Recent Bookings */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-700 font-semibold mb-4">Recent Bookings</h3>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="border-b pb-3">
                    <div className="font-medium">{booking.name}</div>
                    <div className="text-xs text-gray-500">
                      {booking.checkIn} - {booking.checkOut} • {booking.roomType}
                    </div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                      booking.status === 'Paid' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {booking.status}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a href="#" className="text-blue-500 text-sm">View All</a>
              </div>
            </div>
          </div>

          {/* Bottom Stats Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Available Rooms */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Available Rooms</h3>
              <div className="text-3xl font-bold text-gray-800">12 / 32</div>
            </div>
            
            {/* Staff on Duty */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Staff on Duty</h3>
              <div className="text-3xl font-bold text-gray-800">6</div>
            </div>
            
            {/* Check-ins Today */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm mb-2">Check-ins Today</h3>
              <div className="text-3xl font-bold text-gray-800">8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;