# Healthcare Risk Prediction Portal

Healthcare Risk Prediction Portal is a full-stack web app for user authentication, health assessment submission, risk scoring, and assessment history tracking.

## Features

- User signup and login
- Health risk form with score and risk level calculation
- Personalized recommendations based on submitted metrics
- Assessment history and basic user statistics APIs

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL

## Prerequisites

- Node.js and npm
- MySQL server

## Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Create a `.env` file in the project root:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=healthcare_portal
   ```
3. Ensure required MySQL tables (such as `users` and `health_assessments`) exist.
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000`.

## Available Scripts

- `npm start` — run server
- `npm run dev` — run server with nodemon

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/assessments`
- `GET /api/assessments/user/:userId`
- `GET /api/assessments/:id`
- `DELETE /api/assessments/:id`
- `GET /api/users/:userId/stats`
