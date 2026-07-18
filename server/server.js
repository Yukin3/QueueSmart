const express = require("express");
const cors = require("cors");
const path = require("path");

//mock data imports
const services = require("./data/services");
const users = require("./data/users");



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




app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required!",
    });
  }

  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      error: "Invalid email or password!",
    });
  }

  const { password: _password, ...safeUser } = user;

  res.json({
    message: "Login success!",
    user: safeUser,
  });
});



app.listen(PORT, () => {
  console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
});