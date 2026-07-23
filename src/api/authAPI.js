import { apiRequest } from "./client";   //import API function


//send login request
export function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });


}