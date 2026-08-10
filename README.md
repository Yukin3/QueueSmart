# QueueSmart

QueueSmart is a smart queue management application for services such as advising offices, help desks, clinics, and student support centers. The app allows users to view available services, join or leave queues, and track their queue status. Administrators can manage services, view queue activity, and serve users.

## Tech Stack

### Frontend
- React
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Supertest


## Environment Variables

The backend/Database connection requires a `.env` file inside the `server` folder.

Inside it, include the following:

```env
MONGO_URI=mongodb_connection_string
MONGO_TEST_URI=mongodb_test_connection_string
PORT=5050
```

`MONGO_URI` is used to connect the server to the database.

`MONGO_TEST_URI` is used for  connecting to the test database and running automated backend tests.




## Running the Frontend

From the project root:

```bash
npm install
npm run dev
```

Open the URL shown in the terminal.

To build the frontend:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Running the Backend Server

From the project root:

```bash
cd server
npm install
npm run dev
```

Open the URL shown in the terminal.


## Running Both Frontend and Backend

Open two terminals.

In the first terminal, start the backend server

```bash
cd server
npm run dev
```

Start the frontend in the second terminal

```bash
npm run dev
```

Open the URL shown in the terminal.


## Running Backend Tests

To run API/validation tests, enter the `server` directory and run the test script:

```bash
cd server
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```
