import React, { useState } from 'react';
import axios from 'axios';
import { Eye, Mail, User, Lock, Phone, MapPin } from 'lucide-react';
import signup from '../assets/sign up.png';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {

  const navigateTo = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
    address: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.contact) {
      setError('Name, email, password, and contact are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:8870/registerUser", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        contact: formData.contact,
        address: formData.address || null,
        role: formData.role,
      });
      alert("Registration successful!");
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = ()=>

    {
      navigateTo('/signupHostel')
    }

  return (
    <div className="flex min-h-screen bg-slate-800">
      <div className="w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <div className="mb-8">
            <img src={signup} alt="Sign up illustration" className="w-64 h-64" />
          </div>
          
          
          <p className="text-xl text-center">Please sign up to book and search for hostels.</p>
        
         
        </div>
      </div>

      <div className="w-1/2 bg-white rounded-l-3xl p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500 mb-4">Fill in the details to create your account</p>
         

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <input type="email" name="email" placeholder="Enter Your Email" value={formData.email} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" required />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <input type="text" name="name" placeholder="Enter Your Name" value={formData.name} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" required />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="relative">
              <input type="text" name="contact" placeholder="Enter Your Contact" value={formData.contact} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" required />
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <input type="text" name="address" placeholder="Enter Your Address" value={formData.address} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" />
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="relative">
              <input type="password" name="password" placeholder="Enter Your Password" value={formData.password} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" required />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <input type="password" name="confirmPassword" placeholder="Re-enter Your Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-4 border rounded-lg pl-12" required />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

          

            <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white p-4 rounded-lg hover:bg-slate-700 transition-colors">{loading ? 'Registering...' : 'Join Us'}</button>
          </form>

          <p className="text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to='/login' className="text-green-500 hover:text-green-600">Log In</Link>
          </p>
          <p className='text-gray-500 text-center mt-4'>How to Register Hostel ?<span className='text-green-500 hover:text-green-600 cursor-pointer' onClick={handleRedirect}> Click Here</span></p>

          <div className="text-center text-gray-500 mt-4">© 2024 Hostel Finder | Copyright</div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
