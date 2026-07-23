const app = require("./app");



const PORT = 5000; //port server runs on



//start backend server
app.listen(PORT, () => {
  console.log(`QueueSmart backend is running at http://localhost:${PORT}`);
});