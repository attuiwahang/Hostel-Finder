import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, MapPin, Lock } from 'react-feather';
import signup from '../assets/sign up.png';
import axios from 'axios';

const SignUpHostel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hostelName: '',
    ownerName: '',
    email: '',
    contact: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    mainPhoto: null, // storing the file object
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle input changes for both text and file inputs
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRedirect = () => {
    navigate('/how-to-register-hostel');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate that passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Build FormData to handle file upload
    const form = new FormData();
    form.append("hostelName", formData.hostelName);
    form.append("ownerName", formData.ownerName);
    form.append("email", formData.email);
    form.append("password", formData.password);
    form.append("contact", formData.contact);
    form.append("location", formData.location);
    form.append("address", formData.address);
    form.append("latitude", formData.latitude);
    form.append("longitude", formData.longitude);
    form.append("description", formData.description);
    if (formData.mainPhoto) {
      form.append("mainPhoto", formData.mainPhoto);
    }

    try {
      const response = await axios.post('http://localhost:8870/registerOwner', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.error) {
        setError(response.data.message || 'Something went wrong');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-800">
      {/* Left side with illustration */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <div className="mb-8">
            <img src={signup} alt="Sign up illustration" className="w-64 h-64" />
          </div>
          <p className="text-xl text-center">Please sign up to register hostel.</p>
        </div>
      </div>

      {/* Right side with form */}
      <div className="w-1/2 bg-white rounded-l-3xl p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500 mb-4">Fill in the details to create your account</p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Hostel Name */}
            <div className="relative">
              <input 
                type="text" 
                name="hostelName" 
                placeholder="Enter Hostel Name" 
                value={formData.hostelName} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Owner Name */}
            <div className="relative">
              <input 
                type="text" 
                name="ownerName" 
                placeholder="Enter Your Name" 
                value={formData.ownerName} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Email */}
            <div className="relative">
              <input 
                type="email" 
                name="email" 
                placeholder="Enter Your Email" 
                value={formData.email} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Contact */}
            <div className="relative">
              <input 
                type="text" 
                name="contact" 
                placeholder="Enter Your Contact" 
                value={formData.contact} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Location */}
            <div className="relative">
              <input 
                type="text" 
                name="location" 
                placeholder="Enter Location" 
                value={formData.location} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Address */}
            <div className="relative">
              <input 
                type="text" 
                name="address" 
                placeholder="Enter Your Address" 
                value={formData.address} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Latitude and Longitude */}
            <div className="flex space-x-4">
              <div className="relative w-1/2">
                <input 
                  type="number" 
                  name="latitude" 
                  placeholder="Latitude" 
                  value={formData.latitude} 
                  onChange={handleChange} 
                  className="w-full p-4 border rounded-lg pl-12" 
                  required 
                />
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <div className="relative w-1/2">
                <input 
                  type="number" 
                  name="longitude" 
                  placeholder="Longitude" 
                  value={formData.longitude} 
                  onChange={handleChange} 
                  className="w-full p-4 border rounded-lg pl-12" 
                  required 
                />
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            {/* Description */}
            <div className="relative">
              <textarea 
                name="description" 
                placeholder="Enter Description" 
                value={formData.description} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
                rows={3}
              ></textarea>
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Main Photo */}
            <div className="relative">
              <input 
                type="file" 
                name="mainPhoto" 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Password */}
            <div className="relative">
              <input 
                type="password" 
                name="password" 
                placeholder="Enter Your Password" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="Re-enter Your Password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className="w-full p-4 border rounded-lg pl-12" 
                required 
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-800 text-white p-4 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {loading ? 'Registering...' : 'Join Us'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-green-500 hover:text-green-600">Log In</Link>
          </p>
          <p className="text-gray-500 text-center mt-4">
            How to Register Hostel?{' '}
            <span className="text-green-500 hover:text-green-600 cursor-pointer" onClick={handleRedirect}>Click Here</span>
          </p>
          <div className="text-center text-gray-500 mt-4">© 2024 Hostel Finder | Copyright</div>
        </div>
      </div>
    </div>
  );
};

export default SignUpHostel;
