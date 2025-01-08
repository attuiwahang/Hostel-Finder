import React, { useState } from 'react'
import logo from '../assets/logo.png'
import notification from '../assets/notification.png'
import { Link } from 'react-router-dom'

const Navbar = () => {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <div className='h-20 bg-backgroundColor flex justify-between items-center px-16'>
      <div className='flex justify-between items-center gap-2'>
        <img src={logo} alt="logo" />  
        <h2 className='text-[#F9F9FF]'>Hostel Finder</h2>
      </div>
      <div className='flex justify-between items-center gap-6'>
        <div className='flex gap-6 text-[#F9F9FF]'>
         <Link to={'/'}>Home</Link>
         <Link to={'/'}>Hostels</Link>
         <Link to={'/'}>Bookings</Link>
         <Link to={'/'}>About Us</Link>
        </div>

        {isLoggedIn ? ( <div>
          <img src={notification} alt="" className='h-6 w-6'/>
          <img src="" alt="" />
        </div>): 
        ( <div>
         <button className='bg-primaryColor px-4 py-1 text-[#F9F9FF] rounded' >Log in</button>
        </div>)}
       
      </div>
    </div>
  )
}

export default Navbar