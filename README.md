# QueueSmart

QueueSmart is a smart queue management application for services such as advising offices, help desks, clinics, and student support centers. The app allows users to view available services, join or leave queues, and track their queue status. Administrators can manage services, view queue activity, and serve users.

## Tech Stack

### Frontend
- React
- CSS

### Backend
- Node.js
- Express.js
- Jest
- Supertest


## Running the Frontend

From the project root:

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal:

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

The backend is running at:

```text
http://localhost:5000
```

An API documentation page is also available at this root route.


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

The frontend expects the server to be running at:

```text
http://localhost:5000/api
```

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
