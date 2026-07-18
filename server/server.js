const express = require("express");
const cors = require("cors");
const path = require("path");
const services = require("./data/services");




const app = express();
const PORT = 5000;



app.use(cors());
app.use(express.json());




app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});




app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


//routes
app.get("/api/services", (req, res) => {
  res.json(services);
});

app.listen(PORT, () => {
  console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
});