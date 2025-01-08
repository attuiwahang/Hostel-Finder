import React from 'react';
import { Eye, Mail, Lock } from 'lucide-react';
import signup from '../assets/log in.png'
import { Link } from 'react-router';


const Login = () => {
  return (
    <div className="flex min-h-screen bg-slate-800">
      {/* Left Section */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <div className="mb-8">
            <img 
              src={signup} 
              alt="Hostel booking illustration"
              className="w-96 h-72"
            />
          </div>
          <p className="text-xl text-center">
            Please Log In to book and search for hostel of your need.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-white rounded-l-3xl p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Log In</h1>
          <p className="text-gray-500 mb-8">Please log in to your account</p>

          <form className="space-y-4">
            <div className="relative">
              <input
                type="email"
                placeholder="Enter Your Email"
                className="w-full p-4 border rounded-lg pl-12"
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Enter Your Password"
                className="w-full p-4 border rounded-lg pl-12"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Eye className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" size={20} />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Forget Password ?
              </a>
            </div>

            <button className="w-full bg-slate-800 text-white p-4 rounded-lg hover:bg-slate-700 transition-colors">
              Log In
            </button>

            <p className="text-center text-gray-500">
              Does not have an account ?{' '}
              <Link to='/signup' className="text-blue-600 hover:text-blue-700">
                Join US
              </Link>
            </p>

            <div className="flex items-center justify-center space-x-4 my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="text-center">
              <a href="#" className="text-orange-500 hover:text-orange-600">
                Register Hostel
              </a>
            </div>
          </form>

          <div className="text-center text-gray-500 mt-8">
            © 2024HostelFinder | CopyRight
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;