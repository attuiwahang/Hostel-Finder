import React, { useState } from 'react';
import { Eye, Mail, Lock } from 'lucide-react';
import signup from '../assets/log in.png';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post("http://localhost:8870/login", { email, password });
      console.log(response.data);

      localStorage.setItem('info', JSON.stringify(response.data.info))
      localStorage.setItem('Token', JSON.stringify(response.data.token))

      switch (response.data.role) {
        case "STUDENT":
          navigate("/student-dashboard");
          Cookies.set("Token", response.data.token ,{expires: 7})
          break;
        case "hostelOwner":
          navigate("/owner-dashboard");
          break;
        case "ADMIN":
          navigate("/admin-dashboard");
          break;
        default:
          setError("Invalid role or access");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-800">
      {/* Left Section */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <img src={signup} alt="Hostel booking illustration" className="w-96 h-72 mb-8" />
          <p className="text-xl text-center">Please Log In to book and search for a hostel.</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-white rounded-l-3xl p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Log In</h1>
          <p className="text-gray-500 mb-4">Please log in to your account</p>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                className="w-full p-4 border rounded-lg pl-12"
                required
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full p-4 border rounded-lg pl-12 pr-12"
                required
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Eye 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" 
                size={20} 
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="w-full bg-slate-800 text-white p-4 rounded-lg hover:bg-slate-700 transition-colors">
              Log In
            </button>

            <p className="text-center text-gray-500">
              Don't have an account?{' '}
              <Link to='/signup' className="text-blue-600 hover:text-blue-700">Join Us</Link>
            </p>
          </form>

          <div className="text-center text-gray-500 mt-8">
            © 2024 HostelFinder | Copyright
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;