const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { validateRegisterInput } = require("../utils/validation");
const UserCredentials = require("../models/UserCredentials");
const UserProfile = require("../models/UserProfile");


//convert monogo users object
function formatUser(credentials, profile) {
    return {
        id: credentials.accountId,
        accountId: credentials.accountId,
        name: profile?.fullName || "",
        email: credentials.email,
        role: credentials.role,
        adminType: credentials.adminType,
        organizationId: credentials.organizationId,
    };
}


async function loginUser(req, res) {
  try {
     const { email, password } = req.body;


//require email + password
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required!",
    });
  }


  //search for matching email + password
  const credentials = await UserCredentials.findOne({
        email: email.trim().toLowerCase(),
  });



  //if no match, return invalid error
  if (!credentials) {
    return res.status(401).json({
      error: "Invalid email or password!",
    });
  }

  //check typed pw to enytped pw
  const passwordMatches = await bcrypt.compare(password, credentials.passwordHash);

  //handle bad match
  if (!passwordMatches) {
        return res.status(401).json({
            error: "Invalid email or password!",
        });
  }

  const profile = await UserProfile.findOne({
        accountId: credentials.accountId,
  });


  //return success sreesponse w/ user object
    return res.json({
    message: "Login success!",
    user: formatUser(credentials, profile),
  }); 
  } catch (error) {
      return res.status(500).json({
      error: "Login failed.",
      details: error.message,
  });
  }

}


async function registerUser(req, res) {
  try {
     const errors = validateRegisterInput(req.body); //validate registration input

  //handle invalid registration
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid registration input.",
      details: errors,
    });
  }

  const { name, email, password, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  //check if user alr exists
  const existingUser = await UserCredentials.findOne({
      email: normalizedEmail,
  });



  if (existingUser) {
    return res.status(409).json({error: "A user with this email already exists."}); //handle existing user
  }



  const accountId = `${role}-${crypto.randomUUID()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  
  
  //create new user object
  const credentials = await UserCredentials.create({
      accountId,
      email: normalizedEmail,
      passwordHash,
      role,
      adminType: role === "admin" ? "service_admin" : null,
      organizationId: "org-uh",
  });

  const profile = await UserProfile.create({
      accountId,
      credentialId: credentials._id,
      fullName: name.trim(),
      email: normalizedEmail,
      phone: "",
      preferences: {
          notifsEnabled: true,
          contactMethod: "email",
      },
  });


  //return new user object
  return res.status(201).json({
    message: "Registration successful!",
    user: formatUser(credentials, profile),
  }); 
  } catch (error) {
      return res.status(500).json({
      error: "Registration failed.",
      details: error.message,
  });
  }

  
}


//export controller function
module.exports = {loginUser, registerUser};