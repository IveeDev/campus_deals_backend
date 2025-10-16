# Campus Deals Backend API

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A robust and scalable REST API backend for Campus Deals - a marketplace platform tailored specifically for Nigerian university students to buy and sell brand new and used items. Built with modern Node.js technologies and enterprise-grade architecture patterns.

## 🎯 Overview

Campus Deals is designed to be the go-to platform for university students across Nigeria to trade items within their campus communities. Similar to Jiji.ng but focused on the unique needs and constraints of student life.

### Key Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 👤 **User Management** - Comprehensive user profiles with role-based access
- 🏫 **Campus Integration** - Multi-campus support with geolocation
- 📱 **RESTful API** - Clean, documented endpoints following REST conventions
- 🛡️ **Security First** - Helmet, CORS, input validation, and sanitization
- 📊 **Advanced Querying** - Pagination, sorting, filtering, and search
- 🚀 **Production Ready** - Comprehensive logging, error handling, and monitoring

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + HTTP-only cookies
- **Validation**: Zod schemas
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, bcrypt
- **Code Quality**: ESLint, Prettier
- **Development**: Hot reload, Drizzle Studio

### Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # Database connection setup
│   ├── logger.js     # Winston logging configuration
│   └── pagination.js # Pagination and query constants
├── controllers/      # Route handlers and business logic
│   ├── auth.controller.js
│   └── user.controller.js
├── middleware/       # Custom middleware functions
│   └── auth.middleware.js
├── models/           # Database schema definitions (Drizzle ORM)
│   ├── campus.model.js
│   ├── category.model.js
│   ├── favorite.model.js
│   ├── listing.model.js
│   ├── message.model.js
│   ├── review.model.js
│   └── user.model.js
├── routes/           # API route definitions
│   ├── auth.routes.js
│   └── user.routes.js
├── services/         # Business logic and external integrations
│   ├── auth.service.js
│   └── user.service.js
├── utils/            # Utility functions and helpers
│   ├── cookies.js
│   ├── format.js
│   ├── jwt.js
│   └── validation.js
├── validations/      # Zod validation schemas
│   └── auth.validation.js
├── app.js           # Express app configuration
├── index.js         # Application entry point
└── server.js        # Server initialization
```

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- PostgreSQL (>= 13.0)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/IveeDev/campus_deals_backend.git
   cd campus_deals_backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure your environment variables:

   ```bash
   # Server configuration
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info

   # Database configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/campus_deals

   # JWT configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # Security
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Database Setup**

   ```bash
   # Generate database migrations
   npm run db:generate

   # Apply migrations
   npm run db:migrate

   # (Optional) Launch Drizzle Studio for database management
   npm run db:studio
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint         | Description       | Request Body                       |
| ------ | ---------------- | ----------------- | ---------------------------------- |
| POST   | `/auth/sign-up`  | Register new user | `{ name, email, password, phone }` |
| POST   | `/auth/sign-in`  | Login user        | `{ email, password }`              |
| POST   | `/auth/sign-out` | Logout user       | -                                  |

### User Management Endpoints

| Method | Endpoint | Description         | Parameters                                   |
| ------ | -------- | ------------------- | -------------------------------------------- |
| GET    | `/users` | Get paginated users | `page`, `limit`, `search`, `sortBy`, `order` |

### Authentication

The API uses JWT tokens for authentication. Tokens are provided in two ways:

1. **HTTP-only cookies** (recommended for web clients)
2. **Authorization header** with Bearer token

```javascript
// Cookie-based (automatic)
// Token is set as HTTP-only cookie on login

// Header-based
Authorization: Bearer <your-jwt-token>
```

### Request Examples

#### User Registration

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@university.edu.ng",
    "password": "securePassword123!",
    "phone": "+2348012345678"
  }'
```

#### User Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@university.edu.ng",
    "password": "securePassword123!"
  }'
```

#### Get Users (with pagination and search)

```bash
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=10&search=john&sortBy=createdAt&order=desc" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Response Format

All API responses follow a consistent format:

**Success Response:**

```json
{
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error Response:**

```json
{
  "error": "Error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

## 🗄️ Database Schema

The application uses PostgreSQL with Drizzle ORM. Key entities:

### Users

- **id**: Primary key
- **name**: Full name
- **email**: Unique email address
- **password**: Bcrypt hashed password
- **phone**: Phone number
- **role**: User role (user/admin)
- **is_verified**: Email verification status

### Listings

- **id**: Primary key
- **title**: Item title
- **description**: Item description
- **price**: Item price (decimal)
- **condition**: Enum (brand_new/used)
- **image_url**: Item image URL
- **user_id**: Foreign key to users
- **category_id**: Foreign key to categories
- **campus_id**: Foreign key to campuses
- **is_available**: Availability status

### Categories

- Product categorization system
- Name, slug, and description fields

### Campuses

- University campus information
- Geographic coordinates for location-based features

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run start        # Start production server

# Database
npm run db:generate  # Generate new migrations
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Launch Drizzle Studio GUI

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Testing
npm test             # Run test suite
```

### Code Style

The project uses ESLint and Prettier for consistent code formatting:

- **ESLint**: Enforces coding standards and catches potential bugs
- **Prettier**: Automatic code formatting
- **Import aliases**: Clean import paths using `#` prefix

### Logging

Structured logging with Winston:

```javascript
import logger from "#config/logger.js";

// Different log levels
logger.error("Error message", { context: "additional data" });
logger.warn("Warning message");
logger.info("Info message");
logger.debug("Debug message");
```

### Error Handling

Comprehensive error handling with:

- Custom error classes
- Request tracing with unique IDs
- Performance monitoring
- Structured error responses

## 🚀 Deployment

### Environment Variables

Ensure all production environment variables are set:

```bash
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-production-secret>
PORT=3000
LOG_LEVEL=warn
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📋 Roadmap

### Phase 1 (Current)

- [x] User authentication and management
- [x] Basic API structure and security
- [x] Database schema design
- [ ] Listing management endpoints
- [ ] Category management
- [ ] Campus management

### Phase 2 (Upcoming)

- [ ] Image upload and management
- [ ] Search and filtering enhancements
- [ ] Real-time messaging system
- [ ] Email notifications
- [ ] Admin dashboard endpoints

### Phase 3 (Future)

- [ ] Payment integration
- [ ] Mobile push notifications
- [ ] Analytics and reporting
- [ ] Advanced recommendation system
- [ ] Multi-language support

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer**: [IveeDev](https://github.com/IveeDev)

## 📞 Support

For support and questions:

- Create an [issue](https://github.com/IveeDev/campus_deals_backend/issues)
- Contact: [your-email@domain.com]

---

**Built with ❤️ for Nigerian university students**
