import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const HostelDetails = () => {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Get token and extract userId
  const token = Cookies.get("Token");
  let userId = null;
  try {
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      if (decodedToken) userId = decodedToken.id;
    }
  } catch (err) {
    console.error("Error decoding token", err);
  }

  useEffect(() => {
    const fetchHostelDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8870/hostel/getHostelDetail/${id}`);
        setHostel(response.data.hostel);
      } catch (error) {
        console.error("Fetch Error:", error);
        setError("Failed to fetch hostel details");
      } finally {
        setLoading(false);
      }
    };
    fetchHostelDetails();
  }, [id]);

  // Chat related functions
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    
    // Add the new message to the messages array
    setMessages([...messages, { text: newMessage, sender: 'user', timestamp: new Date() }]);
    setNewMessage("");
    
    // Here you would typically send the message to your backend
    // And then handle the response
    // For now, we'll just simulate a response after a delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Thank you for contacting us! We'll get back to you shortly.", 
        sender: 'hostel', 
        timestamp: new Date() 
      }]);
    }, 1000);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    arrivalDate: "",
    numberOfPeople: "",
    phoneNumber: "",
    photo: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      photo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.arrivalDate || !formData.numberOfPeople || !formData.phoneNumber) {
      alert("Please fill in all required fields.");
      return;
    }

    const bookingData = {
      userName: formData.name,
      email: formData.email,
      checkInDate: formData.arrivalDate,
      noOfPeople: formData.numberOfPeople,
      phoneNumber: formData.phoneNumber,
      hostelOwnerId: id,
      userId: userId,
    };

    try {
      const response = await axios.post("http://localhost:8870/booking", bookingData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred while booking the hostel.");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      email: "",
      arrivalDate: "",
      numberOfPeople: "",
      phoneNumber: "",
      photo: null
    });
  };

  const confirmBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8870/booking/payment", {
        hostelOwnerId: id,
        price: 1000,
        userId: userId
      });

      if (response.data.success) {
        window.location.href = response.data.data.payment_url;
      } else {
        alert("Payment initiation failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred while initiating payment");
    }
  };

  // Chat Component
  const ChatBox = () => {
    return (
      <div className="fixed right-0 bottom-0 w-80 bg-white border border-gray-300 shadow-lg rounded-t-lg z-50">
        {/* Chat Header */}
        <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
          <h3 className="font-medium">Chat</h3>
          <button 
            onClick={toggleChat}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Chat Messages */}
        <div className="h-80 p-3 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-32">
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block p-2 rounded-lg max-w-[80%] ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Message Input */}
        <div className="p-2 border-t border-gray-300 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center">
            <button 
              type="button" 
              className="p-2 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your Message" 
              className="flex-1 p-2 mx-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" 
            />
            <button 
              type="submit" 
              className="p-2 text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Hostel Header */}
        <div className="mb-8">
          <div className="flex gap-6">
            <div className="w-1/3">
              <img 
                src={hostel.mainPhoto} 
                alt={hostel.hostelName}
                className="w-full h-[300px] object-cover rounded-lg"
              />
            </div>
            <div className="w-2/3">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-8">
                  <h1 className="text-2xl font-bold text-orange-500">{hostel.hostelName}</h1>
                  <button 
                    onClick={toggleChat}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                  >
                    Chat
                  </button>
                </div>
                
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 text-orange-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-2">{hostel.location}, {hostel.address}</p>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-600">{hostel.description}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Booking Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                <input
                  type="number"
                  placeholder="Number of People"
                  name="numberOfPeople"
                  value={formData.numberOfPeople}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  placeholder="Enter Your Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Book
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Chat box component that shows when chat is open */}
      {isChatOpen && <ChatBox />}

      {/* Booking Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
            <h3 className="text-lg font-semibold text-center mb-4">Booking Confirmed</h3>
            <p className="text-center mb-6">Your booking has been successfully confirmed. Proceed to payment.</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmBooking} className="bg-blue-500 text-white px-4 py-2 rounded">
                Proceed To Pay
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
               Pay Later
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default HostelDetails;