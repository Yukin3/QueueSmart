const users = require("../data/users"); //import mock data, //TODO: replace w/ real data later

function loginUser(req, res) {
  const { email, password } = req.body;


//require email + password
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required!",
    });
  }


  //search for matching email + password
  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );


  //if no match, return invalid error
  if (!user) {
    return res.status(401).json({
      error: "Invalid email or password!",
    });
  }

  
  const { password: _password, ...safeUser } = user; //hide password before retuning user object



  //return success sreesponse w/ user object
  res.json({
    message: "Login success!",
    user: safeUser,
  });
}


//export controller function
module.exports = {
  loginUser,
};