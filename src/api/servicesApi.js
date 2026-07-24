import { apiRequest } from "./client";    //import API function



//handle GET services
export function getServices(query = "") {
  return apiRequest(`/services${query}`);
}

//handle GET single service
export function getServiceById(serviceId) {
  return apiRequest(`/services/${serviceId}`);
}

//handle service creation
export function createService(serviceData) {
    return apiRequest("/services", {
        method: "POST",
        body: JSON.stringify(serviceData),
    });
}



//handle service update
export function updateService(serviceId, serviceData) {
    return apiRequest(`/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(serviceData),
    });
}


//handle service deletion
export function deleteService(serviceId) {
  return apiRequest(`/services/${serviceId}`, {
    method: "DELETE",
  });
}
