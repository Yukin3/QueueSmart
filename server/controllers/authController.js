const crypto = require("crypto");
const { validateRegisterInput } = require("../utils/validation");
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


function registerUser(req, res) {
  const errors = validateRegisterInput(req.body); //validate registration input

  //handle invalid registration
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid registration input.",
      details: errors,
    });
  }

  const { name, email, password, role } = req.body;

  //check if user alr exists
  const existingUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );



  if (existingUser) {
    return res.status(409).json({error: "A user with this email already exists."}); //handle existing user
  }


  //create new user object
  const newUser = {
    id: `${role}-${crypto.randomUUID()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
    organizationId: "org-uh",
  };


  //add newUser to users
  users.push(newUser);



  const { password: _password, ...safeUser } = newUser;  //hide password before retuning user object


  //return new user object
  return res.status(201).json({
    message: "Registration successful!",
    user: safeUser,
  });
  
}


//export controller function
module.exports = {loginUser, registerUser};