# Product Service API

This document provides a comprehensive guide to the Product microservice for the Capstone B2B application. This service is responsible for managing all product-related operations, including creation, retrieval, updates, and deletion of product listings by suppliers.

## Table of Contents
1.  [Core Technologies](#core-technologies)
2.  [Folder Structure](#folder-structure)
3.  [API Endpoints](#api-endpoints)
4.  [Setup & Usage Guide](#setup--usage-guide)
5.  [Environment Variables](#environment-variables)

---

## 1. Core Technologies

This service is built with Node.js and leverages the following key libraries:

| Library                 | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| **Express.js** | The core web server framework.                                       |
| **Mongoose** | An elegant ODM (Object Data Modeling) library for MongoDB.           |
| **jsonwebtoken (JWT)** | For decoding and verifying authentication tokens from the Auth service.|
| **Zod** | For robust and declarative validation of incoming request data.      |
| **dotenv** | For managing environment variables.                                  |
| **express-async-handler**| A utility to handle errors in async middleware without try-catch blocks.|
| **cors** | To enable Cross-Origin Resource Sharing for the front-end.           |

---

## 2. Folder Structure

The project is organized into the following directories to ensure a clean and scalable architecture:

| Folder          | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **/config** | Contains the database connection logic (\`db.js\`).                         |
| **/controllers**| Holds the core business logic for handling API requests (\`productController.js\`). |
| **/middleware** | Contains functions that run before the main controller logic, such as authentication (\`authMiddleware\`), permission checks (\`isSupplier\`), validation (\`validateRequest\`), and error handling (\`errorHandler\`). |
| **/models** | Defines the MongoDB data schema using Mongoose (\`productModel.js\`).       |
| **/routes** | Defines the API endpoints and maps them to controller functions.            |
| **/validation** | Contains the Zod schemas for validating request bodies.                     |

---

## 3. API Endpoints

All endpoints are prefixed with \`/api/products\`.

### Get All Products
- **Route:** \`GET /\`
- **Description:** Retrieves a list of all products.
- **Access:** Public
- **Success Response:** \`200 OK\` with an array of product objects.

### Create a New Product
- **Route:** \`POST /\`
- **Description:** Adds a new product to the database.
- **Access:** Private (Requires a valid JWT from a user with the 'SUPPLIER' role).
- **Request Body (JSON):**
  \`\`\`json
  {
    "name": "Fresh Organic Carrots",
    "description": "Sweet and crunchy carrots, perfect for salads.",
    "price": 1.50,
    "category": "Vegetables",
    "unit": "kg",
    "stock": 200
  }
  \`\`\`
- **Success Response:** \`201 Created\` with the newly created product object.
- **Error Responses:** \`400 Bad Request\` for invalid data, \`401 Unauthorized\` for missing/invalid token, \`403 Forbidden\` if the user is not a supplier.

### Get a Single Product by ID
- **Route:** \`GET /:id\`
- **Description:** Retrieves the details of a single product.
- **Access:** Public
- **Success Response:** \`200 OK\` with the product object.
- **Error Response:** \`404 Not Found\` if the product does not exist.

### Update a Product
- **Route:** \`PUT /:id\`
- **Description:** Updates the details of an existing product. Only the owner of the product can perform this action.
- **Access:** Private (Requires a valid JWT from the 'SUPPLIER' who owns the product).
- **Request Body (JSON):**
  \`\`\`json
  {
    "price": 1.75,
    "stock": 150
  }
  \`\`\`
- **Success Response:** \`200 OK\` with the updated product object.
- **Error Responses:** \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`.

### Delete a Product
- **Route:** \`DELETE /:id\`
- **Description:** Removes a product from the database. Only the owner of the product can perform this action.
- **Access:** Private (Requires a valid JWT from the 'SUPPLIER' who owns the product).
- **Success Response:** \`200 OK\` with a confirmation message.
- **Error Responses:** \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`.

---

## 4. Setup & Usage Guide

Follow these steps to run the service locally.

### 1. Install Dependencies
Navigate to the \`/product\` directory and run:
\`\`\`bash
npm install
\`\`\`

### 2. Set Up Environment Variables
Create a \`.env\` file in the root of the \`/product\` folder and add the required variables. See the section below for details.

### 3. Start the Development Server
\`\`\`bash
npm run dev
\`\`\`
The server will start on \`http://localhost:3002\`.

---

## 5. Environment Variables

The following variables are required in your \`.env\` file:

- **MONGO_URI:** The connection string for your MongoDB Atlas database.
  \`\`\`
  MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/yourDbName"
  \`\`\`

- **JWT_SECRET:** The secret key used to verify JWTs. **This must be the exact same secret used in the Auth service.**
  \`\`\`
  JWT_SECRET="your-super-secret-and-long-random-string-here"
  \`\`\`