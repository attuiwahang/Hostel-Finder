import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FiStar, FiMapPin, FiCalendar, FiUsers, FiPhone, FiMail, 
         FiUpload, FiMessageCircle, FiX, FiSend, FiPaperclip, 
         FiUser, FiHome, FiBriefcase, FiWifi, FiCoffee, FiShield } from "react-icons/fi";

const HostelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const token = localStorage.getItem('Token');
  console.log(token)
  // Get token and extract userId
  let userId = null;
  try {
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      if (decodedToken) userId = decodedToken.id;
    }
  } catch (err) {
    console.error("Error decoding token", err);
  }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    arrivalDate: "",
    numberOfPeople: "",
    phoneNumber: "",
    photo: null,
    specialRequests: "",
    duration: 1
  });

  useEffect(() => {
    const fetchHostelDetails = async () => {
      try {
        // Fetch hostel details
        const response = await axios.get(`http://localhost:8870/hostel/getHostelDetail/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setHostel(response.data.hostel);
        
      } catch (error) {
        console.error("Fetch Error:", error);
        setError("Failed to fetch hostel details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHostelDetails();
  }, [id, token]);

  // Modified chat function to create a chat and redirect to the chat page
  const toggleChat = async () => {
    if (!token ) {
      // If user is not logged in, redirect to login page
      navigate('/login', { state: { returnUrl: `/hostel/${id}` } });
      return;
    }
  
    try {
      setLoading(true);
      
      // Create or get existing chat with this hostel owner
      const response = await axios.post(
        "http://localhost:8870/chat", 
        {
          userId: userId,
          hostelOwnerId: parseInt(id)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      if (response.data.success) {
        // Redirect to chat page with the chat ID
        navigate(`/userchat?chatId=${response.data.chatId}`);
      } else {
        toast.error("Failed to create chat session");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error(error.response?.data?.message || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

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
      specialRequests: formData.specialRequests,
      duration: formData.duration,
      hostelOwnerId: id,
      userId: userId,
      totalAmount: hostel?.startingPrice * hostel.duration * hostel?.numberOfPeople
    };

    try {
      const response = await axios.post("http://localhost:8870/booking", bookingData);
      setIsBookingModalOpen(false);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred while booking the hostel.");
    }
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8870/booking/payment", {
        hostelOwnerId: id,
        price: hostel?.startingPrice * hostel.duration|| 1000,
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

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const getAmenityIcon = (category) => {
    switch(category) {
      case 'WIFI': 
        return <FiWifi className="text-orange-500" />;
      case 'SECURITY':
        return <FiShield className="text-orange-500" />;
      case 'FOOD':
        return <FiCoffee className="text-orange-500" />;
      default:
        return <FiHome className="text-orange-500" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p>Error: {error}</p>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[50vh] bg-gray-900">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${hostel.mainPhoto})`,
            filter: 'brightness(0.7)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="container mx-auto h-full flex items-end">
          <div className="text-white p-8 w-full">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-bold">{hostel.hostelName}</h1>
                <div className="flex items-center mt-2">
                  <FiMapPin className="mr-2" />
                  <p>{hostel.location}, {hostel.address}</p>
                </div>
                <div className="flex items-center mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar 
                      key={star} 
                      className={`w-5 h-5 ${star <= Math.round(hostel.avgRating) ? 'text-orange-400 fill-current' : 'text-gray-400'}`} 
                    />
                  ))}
                  <span className="ml-2">{hostel.avgRating.toFixed(1)} ({hostel.totalRatings} reviews)</span>
                </div>
              </div>
              <div className="flex space-x-4 z-50">
                <button 
                  onClick={toggleChat}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <FiMessageCircle className="mr-2" />
                  Chat
                </button>
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 px-1 ${
                activeTab === "overview"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`pb-4 px-1 ${
                activeTab === "rooms"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Rooms & Prices
            </button>
            <button
              onClick={() => setActiveTab("amenities")}
              className={`pb-4 px-1 ${
                activeTab === "amenities"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Amenities
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`pb-4 px-1 ${
                activeTab === "photos"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 px-1 ${
                activeTab === "reviews"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`pb-4 px-1 ${
                activeTab === "policies"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-500 hover:text-orange-500"
              }`}
            >
              Rules & Policies
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mb-12">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-4">About This Hostel</h2>
                  <p className="text-gray-700 mb-4">{hostel.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-3 rounded-full mr-3">
                        <FiUser className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Owner</p>
                        <p className="font-medium">{hostel.ownerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-3 rounded-full mr-3">
                        <FiPhone className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Contact</p>
                        <p className="font-medium">{hostel.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-3 rounded-full mr-3">
                        <FiHome className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Gender Policy</p>
                        <p className="font-medium">
                          {hostel.gender === "MALE_ONLY" ? "Male Only" : 
                           hostel.gender === "FEMALE_ONLY" ? "Female Only" : "Co-Ed"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-3 rounded-full mr-3">
                        <FiCalendar className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Check-in/out</p>
                        <p className="font-medium">
                          {hostel.checkInTime || "14:00"} / {hostel.checkOutTime || "11:00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Location</h2>
                  <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Map will be displayed here</p>
                    {/* You can integrate Google Maps or any other map service here */}
                  </div>
                  <p className="mt-4 text-gray-700">
                    <FiMapPin className="inline mr-2 text-orange-500" />
                    {hostel.address}, {hostel.location}
                  </p>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h3 className="text-xl font-bold mb-4">Price Overview</h3>
                  <div className="text-3xl font-bold text-orange-500 mb-2">
                    ₹{hostel.startingPrice.toLocaleString('en-IN')}<span className="text-gray-500 text-lg font-normal">/month</span>
                  </div>
                  <p className="text-gray-600 mb-6">Starting price for accommodation</p>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Best price guarantee
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      No booking fees
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Secure payment process
                    </li>
                  </ul>
                  
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-md transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Available Room Types</h2>
              
              {/* Sample room types - replace with actual data */}
              <div className="space-y-6">
                {["DORMITORY", "SHARED_2", "SINGLE_ROOM"].map((roomType, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <div className="bg-gray-200 h-full min-h-48 flex items-center justify-center">
                          <p className="text-gray-500">Room Image</p>
                        </div>
                      </div>
                      <div className="md:col-span-2 p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {roomType === "DORMITORY" ? "Dormitory" : 
                              roomType === "SHARED_2" ? "Shared Room (2 People)" :
                              roomType === "SINGLE_ROOM" ? "Single Room" : roomType}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {roomType === "DORMITORY" ? "Multiple beds in a shared space" : 
                              roomType === "SHARED_2" ? "2-bed room with shared facilities" :
                              roomType === "SINGLE_ROOM" ? "Private room with one bed" : "Room description"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-500">
                              ₹{(hostel.startingPrice * (index + 1)).toLocaleString('en-IN')}
                              <span className="text-gray-500 text-sm font-normal">/month</span>
                            </div>
                            <p className="text-gray-500 text-sm">
                              {roomType === "DORMITORY" ? "per bed" : "per room"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Wi-Fi
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            AC
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Attached Bathroom
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Study Table
                          </span>
                        </div>
                        
                        <button
                          onClick={() => setIsBookingModalOpen(true)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Amenities Tab */}
          {activeTab === "amenities" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Hostel Amenities</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Free WiFi", category: "WIFI" },
                  { name: "24/7 Security", category: "SECURITY" },
                  { name: "Common Kitchen", category: "FOOD" },
                  { name: "Laundry Service", category: "CLEANING" },
                  { name: "Study Rooms", category: "STUDY" },
                  { name: "TV Lounge", category: "ENTERTAINMENT" },
                  { name: "Gym", category: "ENTERTAINMENT" },
                  { name: "Power Backup", category: "UTILITIES" },
                  { name: "Housekeeping", category: "CLEANING" },
                  ...(amenities || [])
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="mr-4">
                      {getAmenityIcon(amenity.category)}
                    </div>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Photos Tab */}
          {activeTab === "photos" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Hostel Photos</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div 
                  className="relative h-48 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openImageModal(hostel.mainPhoto)}
                >
                  <img 
                    src={hostel.mainPhoto} 
                    alt="Main"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Sample photos - replace with actual data */}
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <div 
                    key={item}
                    className="relative h-48 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => openImageModal(`https://source.unsplash.com/random/800x600?hostel,${item}`)}
                  >
                    <img 
                      src={`https://source.unsplash.com/random/800x600?hostel,${item}`}
                      alt={`Hostel ${item}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Guest Reviews</h2>
                <div className="flex items-center">
                  <div className="bg-orange-100 text-orange-500 font-bold rounded-lg px-3 py-1 text-lg mr-2">
                    {hostel.avgRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar 
                          key={star} 
                          className={`w-5 h-5 ${star <= Math.round(hostel.avgRating) ? 'text-orange-400 fill-current' : 'text-gray-400'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">Based on {hostel.totalRatings} reviews</p>
                  </div>
                </div>
              </div>
              
              {/* Sample reviews - replace with actual data */}
              <div className="space-y-6">
                {[
                  { name: "John D.", rating: 5, date: "2 months ago", comment: "Great hostel with excellent facilities. Staff was very helpful and the location was perfect for exploring the city." },
                  { name: "Sarah M.", rating: 4, date: "3 months ago", comment: "Clean rooms and good amenities. The common areas were nice for socializing. Only downside was some noise at night." },
                  { name: "Robert K.", rating: 5, date: "4 months ago", comment: "One of the best hostels I've stayed at. The rooms were comfortable and the staff went above and beyond to help." }
                ].map((review, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                      <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 font-semibold mr-3">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{review.name}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar 
                            key={star} 
                            className={`w-4 h-4 ${star <= review.rating ? 'text-orange-400 fill-current' : 'text-gray-400'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  className="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 font-medium py-2 px-6 rounded-md transition-colors"
                >
                  See All Reviews
                </button>
              </div>
            </div>
          )}
          
          {/* Policies Tab */}
          {activeTab === "policies" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Rules & Policies</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">House Rules</h3>
                  <ul className="space-y-2">
                    {(hostel.rules || "No smoking, No pets, Quiet hours: 10 PM - 6 AM").split(',').map((rule, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 mr-2 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{rule.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Check-in/Check-out</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Check-in time:</p>
                        <p className="text-gray-600">{hostel.checkInTime || "2:00 PM"} onwards</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">Check-out time:</p>
                        <p className="text-gray-600">Until {hostel.checkOutTime || "11:00 AM"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-3">Cancellation Policy</h3>
                  <p className="text-gray-700">
                    Free cancellation up to 7 days before check-in. Cancellations made within 7 days of the check-in date may be subject to a fee equivalent to one month's rent.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Book Your Stay at {hostel.hostelName}</h3>
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="arrivalDate">
                      Check-In Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="arrivalDate"
                        name="arrivalDate"
                        value={formData.arrivalDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="numberOfPeople">
                      Number of People <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUsers className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="numberOfPeople"
                        name="numberOfPeople"
                        value={formData.numberOfPeople}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter number of people"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="duration">
                      Duration (months) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="1"
                        max="12"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="specialRequests">
                      Special Requests
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Any special requirements or preferences?"
                    ></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="photo">
                      Upload ID Proof
                    </label>
                    <div className="relative border border-dashed border-gray-300 rounded-lg p-4">
                      <div className="flex flex-col items-center justify-center text-center">
                        <FiUpload className="text-gray-400 w-8 h-8 mb-2" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          Valid government ID (Aadhar Card, Passport, Driving License)
                        </p>
                      </div>
                      <input
                        type="file"
                        id="photo"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                    {formData.photo && (
                      <p className="mt-2 text-sm text-green-600">{formData.photo.name} selected</p>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-wrap justify-between items-center mb-6">
                    <div>
                      <p className="text-xl font-bold">Price Summary</p>
                      <p className="text-gray-600 text-sm">Based on your selection</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-500">
                        ₹{(hostel.startingPrice * (formData.duration || 1)* formData.numberOfPeople).toLocaleString('en-IN')}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {formData.duration || 1} {formData.duration === 1 ? 'month' : 'months'} × ₹{hostel.startingPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-green-50 p-6 rounded-t-lg">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Booking Confirmed!</h3>
              <p className="text-center text-gray-600">Your booking has been successfully confirmed. Please proceed with the payment to secure your stay.</p>
            </div>
            
            <div className="p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Hostel</span>
                  <span className="font-medium">{hostel.hostelName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Check-in Date</span>
                  <span className="font-medium">{formData.arrivalDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{formData.duration} {formData.duration === 1 ? 'month' : 'months'}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">₹{(hostel.startingPrice * (formData.duration || 1)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-medium">₹{(hostel.startingPrice * 0.5).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-orange-500">₹{(hostel.startingPrice * (formData.duration || 1) * 1.5).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={confirmPayment}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setIsBookingModalOpen(false);
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Pay Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              onClick={() => setIsImageModalOpen(false)}
            >
              <FiX className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-h-[90vh] max-w-full mx-auto"
            />
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default HostelDetails;