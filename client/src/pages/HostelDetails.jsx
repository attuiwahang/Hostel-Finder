// src/pages/HostelDetails.js
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    arrivalDate: "",
    numberOfPeople: "",
    phoneNumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.arrivalDate || !formData.numberOfPeople || !formData.phoneNumber) {
      alert("Please fill in all fields.");
      return;
    }

    if (!hostel) {
      alert("Hostel details not loaded yet.");
      return;
    }

    const bookingData = {
      userName: formData.name,
      email: formData.email,
      checkInDate: formData.arrivalDate,
      noOfPeople: formData.numberOfPeople,
      phoneNumber: formData.phoneNumber,
      hostelOwnerId: id, // Ensure correct hostelOwnerId
      userId: userId,
    };

    console.log("Booking Data:", bookingData);

    try {
      const response = await axios.post("http://localhost:8870/booking", bookingData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Booking response:", response.data);
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
  

     // console.log(response.data.data)
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
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{hostel.hostelName}</h1>
            <p className="text-gray-600">{hostel.location}, {hostel.address}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Booking Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Enter Your Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="email"
                placeholder="Enter Your Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="number"
                placeholder="Number of People"
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="tel"
                placeholder="Enter Your Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            <div className="flex justify-center gap-4">
              <button type="button" onClick={handleCancel} className="px-6 py-2 bg-red-500 text-white rounded">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded">
                Book Now
              </button>
            </div>
          </form>
        </div>
      </div>

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
