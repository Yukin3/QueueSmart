const request = require("supertest");
const app = require("../app"); //import express app


//group all auth API tests
describe("Auth API", () => {


//test valid user creds  
test("logs in a valid user", async () => {

const response = await request(app).post("/api/auth/login").send(
    {
    email: "mmokut@qs.com",
    password: "queuesmart",
});


//confirm
expect(response.statusCode).toBe(200); //request success status
expect(response.body.message).toBe("Login success!"); //success msg 
expect(response.body.user).toHaveProperty("email", "mmokut@qs.com");  //correct email
expect(response.body.user).toHaveProperty("role", "admin"); //correct role
expect(response.body.user).not.toHaveProperty("password");  //no password in respsonse


});



    //test invalid user creds
test("rejects invalid credentials", async () => {

const response = await request(app)
    .post("/api/auth/login")
    .send({
    email: "mmokut@qs.com",
    password: "invalid",
    });


//confirm
expect(response.statusCode).toBe(401); //unauthorized request status 
expect(response.body).toHaveProperty("error"); //error msg in response


});




    //test failure with missing fields
test("rejects missing login fields", async () => {

const response = await request(app).post("/api/auth/login").send({
    email: "",
    password: "",
    });


//confirm
expect(response.statusCode).toBe(400); //bad request status
expect(response.body).toHaveProperty("error"); //error msg in response


});



//test valid user registration
test("registers a new user", async () => {
    const email = `newuser-${Date.now()}@test.com`;
    const response = await request(app).post("/api/auth/register").send({
        name: "New Test User",
        email,
        password: "password123",
        role: "user",
    });


    //confirm succes + body responses
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Registration successful!");
    expect(response.body.user).toHaveProperty("email", email);
    expect(response.body.user).toHaveProperty("role", "user");
    expect(response.body.user).not.toHaveProperty("password");

});



//test existing email registration
test("rejects duplicate registration email", async () => {
    const response = await request(app).post("/api/auth/register").send({
        name: "Duplicate User",
        email: "mmokut@qs.com",
        password: "queuesmart",
        role: "admin",
    });


    //confirm error responses
    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty("error");

    });



//test invalid fields
test("rejects invalid registration fields", async () => {
    const response = await request(app).post("/api/auth/register").send({
        name: "",
        email: "bademail",
        password: "123",
        role: "manager",
    });



    //confirm error responses  
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body).toHaveProperty("details");

});



});