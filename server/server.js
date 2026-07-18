const express = require("express");
const cors = require("cors");
const path = require("path");

//mock data imports
const services = require("./data/services");
const users = require("./data/users");



const app = express();
const PORT = 5000; //port server runs on


//middleware
app.use(cors()); //allows front end/other origin requests
app.use(express.json()); //convert json responses to javascript


//routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); //root, this page has the API docs
});


app.get("/api/health", (req, res) => {
  res.json({ status: "ok" }); //shows status of backend server
});


//Routes



    //Service
app.get("/api/services", (req, res) => {
  res.json(services); //returns list of mock services 
});  //TODO: return services for specific admin/org, add  filtering methods
 


    //Auth
app.post("/api/auth/login", (req, res) => { //login handler
  const { email, password } = req.body; //get email/pw from request

  if (!email || !password) { //require both fields
    return res.status(400).json({
      error: "Email and password are required!",
    });
  } 

  
  const user = users.find( //search for matching credentials in users
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() && //email isn't case sensitive
      item.password === password
  );



  if (!user) { //flag nonexistent user
    return res.status(401).json({
      error: "Invalid email or password!",
    });
  }


  const { password: _password, ...safeUser } = user;  //copy user without pw



  res.json({ //return login success
    message: "Login success!",
    user: safeUser,
  });


});  //TODO: return services for specific admin/org, add  filtering methods, save user info to session(?)




//start backend server
app.listen(PORT, () => {
  console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
});