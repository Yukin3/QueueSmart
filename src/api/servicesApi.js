import { apiRequest } from "./client";    //import API function



//handle GET services
export function getServices(query = "") {
  return apiRequest(`/services${query}`);
}




//handle service creation
export function createService(serviceData) {
    return apiRequest("/services", {
        method: "POST",
        body: JSON.stringify(serviceData),
    });
}




//handle service PATCH
export function updateService(serviceId, serviceData) {
    return apiRequest(`/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify(serviceData),
    });


}