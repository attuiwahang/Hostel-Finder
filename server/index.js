const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const hostelRoute = require("./routes/HostelRoute");
const bookingRoute = require("./routes/bookingRoute");
const staffRoute = require("./routes/staffRoute");
const roomRoute = require("./routes/roomRoute");
const chatRoute = require("./routes/chatRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const notificationRoute = require("./routes/notificationRoute");

const { initializeSocket } = require("./config/socketConfig");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static("uploads/")); // Serve static files from uploads

// API Routes
app.use("/", authRoute);
app.use("/hostel", hostelRoute);
app.use("/booking", bookingRoute);
app.use("/staff", staffRoute);
app.use("/room", roomRoute);
app.use("/chat", chatRoute);
app.use("/dashbaord", dashboardRoute);
app.use("/notifications", notificationRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

const port = process.env.PORT || 8870;
server.listen(port, () => {
  console.log(`Server with Socket.IO running on http://localhost:${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});