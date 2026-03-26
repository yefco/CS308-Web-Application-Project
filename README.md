# Online Store — Backend API

Rust backend for the CS 308 Online Store project. Built with Axum and PostgreSQL.

## Stack

- **Runtime:** Rust + Tokio (async)
- **Framework:** Axum 0.7
- **Database:** PostgreSQL + SQLx (async, compile-time checked queries)
- **Auth:** bcrypt password hashing, JWT (HS256) token issuance

## What's Implemented

- User registration with duplicate email detection
- User login with bcrypt password verification
- JWT token generation (24h expiry, encodes user ID + role)
- Unified error handling with proper HTTP status codes
- CORS enabled for frontend development
- Full database schema covering: users, products, categories, orders, invoices, payments, shopping carts, comments, ratings, wishlists, deliveries, refund requests, and notifications

## Project Structure

```
src/
├── main.rs                  # Entry point — wires DB, services, routes, server
├── config/
│   └── app_config.rs        # Env-based configuration
├── database/
│   ├── db.rs                # PostgreSQL connection pool
│   └── schema.sql           # Full database schema
├── models/
│   └── user.rs              # User entity, request/response DTOs
├── repository/
│   └── user_repository.rs   # SQL queries for users table
├── services/
│   └── auth_service.rs      # Auth business logic (hash, verify, JWT)
├── handlers/
│   └── auth_handler.rs      # HTTP request handlers
├── routes/
│   └── auth_routes.rs       # URL → handler mapping
├── utils/
│   └── errors.rs            # Unified AppError type
└── middleware/               # Reserved for JWT auth guard
```

## API Endpoints

| Method | Path                | Description        | Auth |
|--------|---------------------|--------------------|------|
| GET    | `/`                 | Health check       | No   |
| POST   | `/api/auth/sign-up` | Register new user  | No   |
| POST   | `/api/auth/login`   | Authenticate user  | No   |

## Setup

```bash
# 1. Create database
psql -d postgres -c "CREATE DATABASE online_store;"

# 2. Run schema
psql -d online_store -f src/database/schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Run
cargo run
```

## Environment Variables

| Variable               | Required | Default   |
|------------------------|----------|-----------|
| `DATABASE_URL`         | Yes      | —         |
| `JWT_SECRET`           | Yes      | —         |
| `SERVER_HOST`          | No       | `0.0.0.0` |
| `SERVER_PORT`          | No       | `3000`    |
| `JWT_EXPIRATION_HOURS` | No       | `24`      |

## Next Steps

- [ ] JWT auth middleware for protected routes
- [ ] Product CRUD (product manager)
- [ ] Shopping cart (guest + authenticated)
- [ ] Order placement + payment flow
- [ ] Comment/rating system with approval
- [ ] Sales manager dashboard (discounts, invoices, revenue)
- [ ] Delivery tracking
- [ ] Refund request flow
>>>>>>> origin/master
