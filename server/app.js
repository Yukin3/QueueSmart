const express = require("express");
const cors = require("cors");
const path = require("path");

//route imports
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");



const app = express();



//middleware
app.use(cors()); //allows front end/other origin requests
app.use(express.json()); //convert json responses to javascript


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); //log api usage
  next();
});





app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); //*root - API docs
});


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" }); //*backend status
});



//*API Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);


module.exports = app; //export express app


