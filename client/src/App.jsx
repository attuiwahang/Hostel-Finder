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
    </Routes>
  </BrowserRouter>
</>
  )
}

export default App
