const BACKEND_URL = "http://localhost:5000/api"; 


//API reques helper function
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, { //send request to the API
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });




  const data = await response.json(); //convert json body to JS objecct



  if (!response.ok) { //give error if unsuccessful request
    throw data;
  }

  return data;
}