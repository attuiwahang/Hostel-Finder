const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const authRoute = require("./routes/authRoute")

app.use(express.json())
app.use(express.urlencoded({extended:true}))


const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true,
};



app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("", authRoute);

const port = 8870;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});