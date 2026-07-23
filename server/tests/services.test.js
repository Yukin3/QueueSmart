const request = require("supertest");
const app = require("../app"); //import express app




//group service API tests
describe("Services API", () => {

//test non empty list return
test("returns a list of services", async () => {

    const response = await request(app).get("/api/services");


    //confirm
    expect(response.statusCode).toBe(200); //success status
    expect(Array.isArray(response.body)).toBe(true); //response body is array
    expect(response.body.length).toBeGreaterThan(0); //at least 1 service in list

});


//test services have correct attributes
test("service objects include required fields", async () => {

    const response = await request(app).get("/api/services");
    const service = response.body[0]; //use first service obj


    //confirm
    expect(service).toHaveProperty("id"); //has id
    expect(service).toHaveProperty("organizationId"); //linked to org
    expect(service).toHaveProperty("adminId"); //linked to admin
    expect(service).toHaveProperty("name");  //includes basic fields..
    expect(service).toHaveProperty("description");
    expect(service).toHaveProperty("expectedDuration"); //includes timing info
    expect(service).toHaveProperty("priority"); //includes priority
    expect(service).toHaveProperty("isOpen"); //includes availability


});



//test creation of valid service
test("creates a service with valid data", async () => {
    const response = await request(app).post("/api/services").send({
        name: "Test Service",
        description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibu",
        expectedDuration: 25,
        priority: "medium",
        adminId: "admin-001",
        organizationId: "org-uh",
    });



    //confirm
    expect(response.statusCode).toBe(201); //success response
    expect(response.body.message).toBe("Service created successfully."); //expected success msg
    expect(response.body.service).toHaveProperty("id"); //ID generated
    expect(response.body.service.name).toBe("Test Service"); //important fields saved..
    expect(response.body.service.expectedDuration).toBe(25);

});



//test rejection of invalid service
test("rejects invalid service data", async () => {
    const response = await request(app).post("/api/services").send({
        name: "",
        description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam qu",
        expectedDuration: 500,
        priority: "urgent",
    });



    //confirm
    expect(response.statusCode).toBe(400); //bad request repsonse
    expect(response.body).toHaveProperty("error", "Invalid service data."); //expected error msg
    expect(response.body.details).toHaveProperty("name"); //validation details returned for each invalid field....
    expect(response.body.details).toHaveProperty("description");
    expect(response.body.details).toHaveProperty("expectedDuration");
    expect(response.body.details).toHaveProperty("priority");


});


});