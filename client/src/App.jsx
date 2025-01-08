import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router";
import './App.css'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login';

function App() {
  const [count, setCount] = useState(0)

  return (
  <>
     <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </BrowserRouter>
</>
  )
}

export default App
