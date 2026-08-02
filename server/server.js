require("dotenv").config();

const { connect } = require("mongoose");
const app = require("./app");
//const dbConnect = require("./config/db") //TODO: import function


const PORT = 5000; //port server runs on //TODO: get port from env

//connectDB(); //TODO: call func



//start backend server
app.listen(PORT, () => {
  console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
});