const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static("uploads/")); // Serve static files from uploads

app.use("/", authRoute);

const port = process.env.PORT || 8870;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
