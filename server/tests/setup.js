require("dotenv").config();

const mongoose = require("mongoose");

beforeAll(async () => {
  const uri = process.env.MONGO_TEST_URI ;

  if (!uri) {
    throw new Error("MONGO_TEST_URI  is required for testing.");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});