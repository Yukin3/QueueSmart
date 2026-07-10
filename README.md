# QueueSmart Administrator Screens (React)

A front-end-only implementation of the QueueSmart administrator experience using React and Vite.

## Included screens

- **Admin Dashboard**
  - List of services
  - Current queue lengths and estimated waits
  - Quick open/close queue actions
  - Summary metrics
- **Service Management**
  - Create and edit services
  - Delete services
  - Open and close services
  - Client-side validation:
    - Required name and description
    - Service name limited to 100 characters
    - Expected duration must be a whole number from 1–480
    - Low, medium, or high priority
- **Queue Management**
  - Select a service
  - View the service queue
  - Reorder users
  - Remove users
  - Simulate serving the next user

The application uses mock data and stores UI changes in browser `localStorage`, so no backend is required.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Integration notes

- Mock data is in `src/data/mockData.js`.
- Replace state mutations in `src/App.jsx` with API calls in Assignment 3.
- The current UI is intentionally dependency-light: only React and Vite are required.
