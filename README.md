# RentNest 🏠
**"Find & List Rental Properties with Ease"**

RentNest is a robust, production-ready backend REST API for a rental property marketplace. It provides a complete marketplace platform that connects tenants seeking rental units with landlords listing their properties, overseen by administrators who moderate the community.

The project features role-based access control, automated inputs validation, structured error responses, interactive Swagger documentation, and integrated Stripe payment processing.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js + Express
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma Client
*   **Authentication & Security:** JSON Web Tokens (JWT) & bcryptjs
*   **Payment Processing:** Stripe API
*   **Request Validation:** Zod
*   **API Documentation:** Swagger UI (`swagger-ui-express` & `swagger-jsdoc`)
*   **Development Utilities:** `tsx` (TypeScript Execute), `typescript`

---

## 👥 Roles & Permissions

RentNest supports three distinct user roles with specific access control permissions:

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Tenant** | Users looking for rental properties | Browse listings, search & filter, submit rental requests, make Stripe payments, submit property reviews, manage profile |
| **Landlord** | Property owners listing rental units | Create and manage property listings, set property availability, approve or reject rental requests, view rental history and tenant reviews |
| **Admin** | Platform moderators | Manage all users, toggle user status (ban/unban), oversee all listings and requests, manage property categories |

---

## 🗄️ Database Architecture

RentNest uses **PostgreSQL** with **Prisma** to manage the database schema. The core models and relationships are illustrated in the Entity-Relationship Diagram below:

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string password
        Role role
        UserStatus status
        DateTime createdAt
        DateTime updatedAt
    }
    CATEGORY {
        string id PK
        string name UK
        DateTime createdAt
        DateTime updatedAt
    }
    PROPERTY {
        string id PK
        string title
        string description
        string location
        float price
        string categoryId FK
        string[] amenities
        string[] images
        boolean availability
        string landlordId FK
        DateTime createdAt
        DateTime updatedAt
    }
    RENTAL_REQUEST {
        string id PK
        string propertyId FK
        string tenantId FK
        DateTime startDate
        DateTime endDate
        RentalRequestStatus status
        float totalPrice
        DateTime createdAt
        DateTime updatedAt
    }
    PAYMENT {
        string id PK
        string transactionId UK
        string rentalRequestId FK
        float amount
        string method
        string provider
        PaymentStatus status
        DateTime paidAt
        DateTime createdAt
        DateTime updatedAt
    }
    REVIEW {
        string id PK
        string propertyId FK
        string tenantId FK
        int rating
        string comment
        DateTime createdAt
        DateTime updatedAt
    }

    USER ||--o{ PROPERTY : "lists"
    USER ||--o{ RENTAL_REQUEST : "requests"
    USER ||--o{ REVIEW : "writes"
    CATEGORY ||--o{ PROPERTY : "classifies"
    PROPERTY ||--o{ RENTAL_REQUEST : "receives"
    PROPERTY ||--o{ REVIEW : "receives"
    RENTAL_REQUEST ||--o{ PAYMENT : "has"
```

---

## 🚀 Key Features

### 1. Authentication & Security
*   Secure signup and login using **bcryptjs** password hashing.
*   Stateless authentication using **JSON Web Tokens (JWT)** passed via HTTP headers or cookies.
*   Role-based authorization middleware restricting endpoints to specific roles (`TENANT`, `LANDLORD`, `ADMIN`).
*   Account status moderation: banned users are immediately blocked from logging in or performing actions.

### 2. Properties Marketplace (Public)
*   Browse all listed properties.
*   Search and filter properties by location, price range, property categories, and specific amenities.
*   Retrieve detailed information for individual property listings.

### 3. Tenant Workflows
*   Submit rental requests specifying rental dates (`startDate` and `endDate`). Total price is automatically calculated based on rental duration and property price.
*   Process secure credit card payments via **Stripe** once a rental request is approved by a landlord.
*   Submit reviews and ratings (1-5 stars) for completed rentals.

### 4. Landlord Management
*   Complete CRUD operations on property listings.
*   Set property availability toggles to hide or display properties in public search.
*   Review, approve, or reject rental requests for owned properties.

### 5. Platform Moderation (Admin)
*   Access and oversee all platform users, listings, and rental transactions.
*   Toggle user status between `ACTIVE` and `BANNED` to moderate the platform.
*   Create and manage property categories.

---

## 🛣️ API Endpoints

### 🔐 Authentication
*   `POST /api/auth/register` - Register a new user (Tenant or Landlord).
*   `POST /api/auth/login` - Authenticate user and return a JWT.
*   `GET /api/auth/me` - Retrieve current authenticated user details.

### 🏠 Properties (Public)
*   `GET /api/properties` - List properties with location, price range, and category filters.
*   `GET /api/properties/:id` - Retrieve detailed info for a single property.
*   `GET /api/categories` - Fetch all property categories.

### 🧑‍🌾 Landlord Management
*   `POST /api/landlord/properties` - Create a property listing.
*   `PUT /api/landlord/properties/:id` - Update a property listing.
*   `DELETE /api/landlord/properties/:id` - Delete a property listing.
*   `GET /api/landlord/requests` - Retrieve rental requests for the landlord's properties.
*   `PATCH /api/landlord/requests/:id` - Approve or reject a rental request.

### 📝 Rental Requests (Tenant)
*   `POST /api/rentals` - Submit a new rental request.
*   `GET /api/rentals` - Retrieve current tenant's rental requests history.
*   `GET /api/rentals/:id` - Retrieve detailed info for a single rental request.

### 💳 Payments
*   `POST /api/payments/create` - Generate a Stripe checkout session for approved rental requests.
*   `POST /api/payments/confirm` - Confirm a successful payment transaction (simulates webhook or callback handler).
*   `GET /api/payments` - Retrieve current user's payment/transaction history.
*   `GET /api/payments/:id` - Retrieve detailed info for a single payment.

### ⭐ Reviews
*   `POST /api/reviews` - Leave a review and rating for a property.

### 👑 Admin Management
*   `GET /api/admin/users` - View all platform users.
*   `PATCH /api/admin/users/:id` - Ban or unban a user.
*   `GET /api/admin/properties` - View all listings.
*   `GET /api/admin/rentals` - View all rental requests.

---

## ⚙️ Configuration & Installation

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn
*   PostgreSQL database instance

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
PORT=8000
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"
JWT_SECRET="your_secure_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# Stripe Configurations
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Setup Database & Seeding
Run Prisma migrations to create the database schemas and generate the Prisma Client:
```bash
# Run database migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Seed default categories and admin credentials
npm run prisma:seed
```
*Note: Seeding creates an Admin user with email `admin@rentnest.com` and password `admin123`.*

---

## 🖥️ Running the Application

### Development Mode
Start the application with hot-reloading enabled (using `tsx watch`):
```bash
npm run dev
```

### Production Build & Run
Compile TypeScript to JavaScript and run the production server:
```bash
npm run build
npm start
```

---

## 📚 API Documentation

Once the server is running, the interactive **Swagger OpenAPI Documentation** is available at:
```
http://localhost:8000/api-docs
```
You can use the built-in UI to inspect schemas, explore all request bodies, and execute API endpoints directly from your browser. Use the `Authorize` button with a generated JWT token (`Bearer <token>`) to access protected routes.

---

## 🧪 Integration Tests

RentNest includes an automated end-to-end integration test suite that tests registration, login, property creation, rental requests, Stripe payment simulation, reviews, and admin banning workflows.

To run the integration tests:
```bash
npm run test
```
The test suite runs on an isolated port (`5001`) and prints details of each step's success or failure to the terminal.
