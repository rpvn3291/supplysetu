# Auth Microservice - Capstone Project

This service is the central hub for all user authentication and management for the B2B Street Vendor application. It handles user registration, login, profile management, and API security using JWTs.

## Table of Contents
1.  [Folder Structure](#folder-structure)
2.  [Core Libraries & Technologies](#core-libraries--technologies)
3.  [API Endpoint Documentation](#api-endpoint-documentation)
4.  [Setup and Local Development](#setup-and-local-development)
5.  [Environment Variables](#environment-variables)

---

## Folder Structure

A quick overview of the key directories and their purpose.

\`\`\`
/auth
├── 📂 controllers/      # Contains the core business logic for each route.
├── 📂 middleware/       # Holds reusable functions that run before controllers (e.g., auth, error handling, validation).
├── 📂 prisma/           # Manages the database schema and migrations.
├── 📂 routes/           # Defines the API endpoints and connects them to controller functions.
├── 📂 services/         # Contains utility services like JWT generation.
├── 📂 utils/            # Holds helper functions, like password hashing.
├── 📂 validation/       # Contains Zod schemas for request validation.
├── 📄 .env.example      # Example environment file. You should create a .env file based on this.
├── 📄 package.json      # Project dependencies and scripts.
└── 📄 server.js          # The main entry point for the Express server.
\`\`\`

---

## Core Libraries & Technologies

This service is built with a modern, secure, and robust stack.

| Library                 | Role & Purpose                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **Express.js** | The core web server framework for building the API.                                                      |
| **Prisma** | A next-generation ORM that manages database connections, schema, migrations, and provides a type-safe client. |
| **PostgreSQL** | The powerful, open-source relational database used to store user and profile data.                         |
| **Zod** | A TypeScript-first schema validation library used to validate and sanitize all incoming request data.        |
| **bcryptjs** | A library for securely hashing and comparing user passwords.                                             |
| **jsonwebtoken (JWT)** | Used to generate secure access tokens for authenticating users and protecting API routes.                  |
| **cors** | A middleware to enable Cross-Origin Resource Sharing, allowing a front-end to communicate with this API.   |
| **express-async-handler** | A utility that wraps async route handlers, catching errors and passing them to our centralized error handler. |
| **dotenv** | Loads environment variables from a \`.env\` file into the application.                                     |
| **nodemon** | A tool that automatically restarts the server during development when file changes are detected.           |

---

## API Endpoint Documentation

All endpoints are prefixed with \`/api/auth\`.

### \`POST /register\`
Creates a new user and their associated profile.

- **Body (\`raw/json\`):**
  - **For VENDOR:**
    \`\`\`json
    {
        "email": "vendor@example.com",
        "password": "strongPassword123",
        "role": "VENDOR",
        "profileData": {
            "firstName": "Ravi",
            "lastName": "Kumar",
            "address": "123 KPHB Colony",
            "pincode": "500072",
            "phoneNumber": "9876543210"
        }
    }
    \`\`\`
  - **For SUPPLIER:**
    \`\`\`json
    {
        "email": "supplier@example.com",
        "password": "strongPassword456",
        "role": "SUPPLIER",
        "profileData": {
            "companyName": "Hyderabad Fresh Produce",
            "warehouseAddress": "456 Industrial Area, Gachibowli",
            "pincode": "500032",
            "contactPerson": "Anjali Rao",
            "gstId": "36ABCDE1234F1Z5"
        }
    }
    \`\`\`
- **Success Response (201 Created):**
  \`\`\`json
  {
      "message": "User registered successfully",
      "token": "...",
      "user": { "id": "...", "email": "...", "role": "..." }
  }
  \`\`\`
- **Error Responses:** \`400 Bad Request\` (invalid data), \`409 Conflict\` (email already exists).

---

### \`POST /login\`
Authenticates a user and returns a JWT.

- **Body (\`raw/json\`):**
  \`\`\`json
  {
      "email": "vendor@example.com",
      "password": "strongPassword123"
  }
  \`\`\`
- **Success Response (200 OK):**
  \`\`\`json
  {
      "message": "Login successful",
      "token": "...",
      "user": { "id": "...", "email": "...", "role": "..." }
  }
  \`\`\`
- **Error Responses:** \`400 Bad Request\` (missing fields), \`401 Unauthorized\` (invalid credentials).

---

### \`GET /me\`
**(Protected)** Fetches the profile of the currently authenticated user.

- **Headers:** \`Authorization: Bearer <YOUR_JWT_TOKEN>\`
- **Success Response (200 OK):**
  \`\`\`json
  {
      "user": { "id": "...", "email": "...", "role": "..." },
      "profile": { ... } // VendorProfile or SupplierProfile object
  }
  \`\`\`
- **Error Responses:** \`401 Unauthorized\` (no/invalid token), \`404 Not Found\` (profile missing).

---

### \`PUT /update-profile\`
**(Protected)** Updates the profile of the currently authenticated user.

- **Headers:** \`Authorization: Bearer <YOUR_JWT_TOKEN>\`
- **Body (\`raw/json\`):** Send only the fields you want to update.
  \`\`\`json
  {
      "phoneNumber": "8888888888",
      "address": "A new updated address"
  }
  \`\`\`
- **Success Response (200 OK):**
  \`\`\`json
  {
      "message": "Profile updated successfully",
      "profile": { ... } // The updated profile object
  }
  \`\`\`
- **Error Responses:** \`401 Unauthorized\`.

---

### \`PATCH /toggle-kyc/:userId\`
Toggles the \`isVerified\` status of a user. *Note: In production, this should be an admin-only route.*

- **URL Parameter:** \`userId\` - The ID of the user to update.
- **Success Response (200 OK):**
  \`\`\`json
  {
      "message": "User KYC status toggled to true",
      "user": { "id": "...", "email": "...", "isVerified": true }
  }
  \`\`\`
- **Error Responses:** \`404 Not Found\` (user not found).

---

## Setup and Local Development

Follow these steps to run the service on your local machine.

1.  **Clone the Repository**
    \`\`\`bash
    git clone <your-repo-url>
    cd CapstoneProject/auth
    \`\`\`
2.  **Install Dependencies**
    \`\`\`bash
    npm install
    \`\`\`
3.  **Set Up Environment Variables**
    - Create a file named \`.env\` in the \`auth\` directory.
    - Copy the contents of \`.env.example\` into it.
    - Fill in the required values for \`DATABASE_URL\` and \`JWT_SECRET\`.
4.  **Run Database Migrations**
    - This command will sync your Prisma schema with your database, creating all the necessary tables.
    \`\`\`bash
    npx prisma migrate dev
    \`\`\`
5.  **Start the Development Server**
    \`\`\`bash
    npm run dev
    \`\`\`
    The server will start on \`http://localhost:3001\`.

---

## Environment Variables

The following variables are required in your \`.env\` file for the application to run.

- **\`DATABASE_URL\`**: The connection string for your PostgreSQL database (e.g., from Neon).
  \`\`\`
  DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
  \`\`\`
- **\`JWT_SECRET\`**: A long, random, and secret string used to sign the JWTs. You can generate one easily online.
  \`\`\`
  JWT_SECRET="your-super-secret-and-long-random-string-here"
  \`\`\`
`