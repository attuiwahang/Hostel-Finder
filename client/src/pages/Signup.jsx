import React from 'react';
import { Eye, Mail, User, Lock } from 'lucide-react';
import signup from '../assets/sign up.png'
import { Link } from 'react-router';

const Signup = () => {
  return (
    <div className="flex min-h-screen bg-slate-800">
 
      <div className="w-1/2 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md">
          <div className="mb-8">
            <img 
              src={signup}
              alt="Login illustration" 
              className="w-64 h-64"
            />
          </div>
          <p className="text-xl text-center">
            Please Log In to book and search for hostel of your need.
          </p>
        </div>
      </div>

   
      <div className="w-1/2 bg-white rounded-l-3xl p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8">Please fill the details to create your account</p>

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
                type="text"
                placeholder="Enter Your Name"
                className="w-full p-4 border rounded-lg pl-12"
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Eye className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" size={20} />
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

            <div className="relative">
              <input
                type="password"
                placeholder="Re enter Your Password"
                className="w-full p-4 border rounded-lg pl-12"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Eye className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" size={20} />
            </div>

            <button className="w-full bg-slate-800 text-white p-4 rounded-lg hover:bg-slate-700 transition-colors">
              Join Us
            </button>

            <p className="text-center text-gray-500">
              Already have an account?{' '}
              <Link to='/login' className="text-green-500 hover:text-green-600">
                Log In
              </Link>
            </p>
          </form>

          <div className="text-center text-gray-500 mt-8">
            © 2024HostelFinder | CopyRight
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;