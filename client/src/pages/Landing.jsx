import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Services from '../components/Services'
import About from '../components/About'
import Footer from '../components/Footer'

const Landing = () => {
  return (
    <div>
        <div>
          <Navbar/>
          <Hero />
          <Services />
          <About />
          <Footer /> 
        
        </div>
    </div>
  )
}

export default Landing