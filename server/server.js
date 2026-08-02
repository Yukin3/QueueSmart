require("dotenv").config();

const { connect } = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");


const PORT = process.env.PORT || 5000; //port server runs on




//start backend server after db connection
async function startServer(){
  await connectDB(); //connect to mongoDB

  //start server
  app.listen(PORT, () => {
    console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
  });

}


startServer();
