import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router";
import './App.css'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login';
import SignUpHostel from './pages/SignUpHostel';
import StudentDash from './pages/StudentDash';
import Ownerdash from './pages/Ownerdash';
import Admindash from './pages/Admindash';
import AboutUs from './components/AboutUs';
import Hostels from './pages/Hostels';
import HostelDetails from './pages/HostelDetails';
import Success from './pages/success';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import Staffs from './pages/Staffs';
import Room from './pages/Room';
import UserBookings from './pages/UserBookings';
import ChatInterface from './pages/ChatInterface';
import HostelInfo from './pages/HostelInfo';
import ManageRooms from './pages/ManageRooms';
import UserChat from './pages/UserChat';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  const [count, setCount] = useState(0)

  return (
  <>
     <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signupHostel" element={<SignUpHostel />} />
      <Route path="/student-dashboard" element={<StudentDash />} />
      <Route path="/owner-dashboard" element={<Ownerdash />} />
      <Route path="/admin-dashboard" element={<Admindash />} />
      <Route path="/AboutUs" element={<AboutUs />} />
      <Route path="/hostels" element={<Hostels/>} />
      <Route path="/hostelDetails/:id" element={<HostelDetails/>} />
      <Route path="/success" element={<Success />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/manageBookings" element={<Booking />} />
      <Route path="/bookings" element={<UserBookings />} />
      <Route path="/staff" element={<Staffs />} />
      <Route path="/rooms" element={<ManageRooms />} />
      <Route path="/chat" element={<ChatInterface />} />
      <Route path="/userChat" element={<UserChat />} />
      <Route path="/info" element={<HostelInfo />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      
    </Routes>
  </BrowserRouter>
</>
  )
}

export default App
