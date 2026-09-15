# Quick Start Guide

## Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create PostgreSQL Database
```sql
CREATE DATABASE taskmanager;
```

### 3. Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# Change these lines:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_DATABASE=taskmanager
```

### 4. Start the Application
```bash
npm run start:dev
```

Wait for: `✅ AppModule initialized - Database connection established`

### 5. Seed Sample Data
```bash
# In a new terminal
npm run seed
```

### 6. Open Swagger Docs
Navigate to: http://localhost:3000/docs

## Testing the API (2 minutes)

### 1. Login
1. Go to http://localhost:3000/docs
2. Click `POST /auth/login`
3. Click "Try it out"
4. Use these credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```
5. Click "Execute"
6. Copy the `access_token` from the response

### 2. Authorize
1. Click the green "Authorize" button (top right)
2. Paste: `Bearer YOUR_ACCESS_TOKEN`
3. Click "Authorize"
4. Click "Close"

### 3. Try Protected Endpoints
Now you can test any endpoint! Try:
- `GET /users/me` - See your profile
- `GET /projects` - See all projects
- `POST /projects` - Create a new project
- `GET /projects/{id}/tasks` - See tasks for a project

## Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires running database)
npm run test:e2e

# With coverage
npm run test:cov
```

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| john@example.com | password123 | member |
| jane@example.com | password123 | member |

## Common Commands

```bash
npm run start:dev   # Development mode with hot reload
npm run build       # Build for production
npm run start:prod  # Run production build
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
npm run seed        # Seed database with sample data
```

## Project Structure Quick Reference

```
src/
├── auth/          → POST /auth/register, /auth/login
├── users/         → GET /users/me
├── projects/      → CRUD for projects
├── tasks/         → CRUD for tasks
├── common/        → Shared guards, decorators, interceptors
├── database/      → Seed script
├── app.module.ts  → Root module
└── main.ts        → Bootstrap & Swagger setup
```

## NestJS Concepts Demonstrated

✅ Modules (5 feature modules)  
✅ TypeORM Entities with Relations  
✅ DTOs with Validation  
✅ JWT Authentication  
✅ Role-based Authorization  
✅ Custom Decorators (@CurrentUser)  
✅ Guards (JwtAuthGuard, RolesGuard)  
✅ Interceptors (Logging, Transform)  
✅ Exception Filters  
✅ Middleware  
✅ Pipes (ValidationPipe, ParseUUIDPipe)  
✅ Config Module  
✅ Swagger/OpenAPI  
✅ Testing (Unit + E2E)  
✅ Lifecycle Hooks  

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `psql -U postgres`
- Verify credentials in `.env`
- Ensure database exists: `CREATE DATABASE taskmanager;`

### Port Already in Use
Change in `.env`:
```
PORT=3001
```

### Can't Access Protected Routes in Swagger
1. Login via `POST /auth/login`
2. Copy `access_token`
3. Click "Authorize" button
4. Enter: `Bearer YOUR_TOKEN`

## What's Next?

1. Explore the code structure
2. Try creating your own entities
3. Add new features (comments, file uploads, etc.)
4. Study the test files to understand testing patterns
5. Read IMPLEMENTATION_SUMMARY.md for detailed explanations

## Documentation

- **Full README**: `README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Swagger UI**: http://localhost:3000/docs

Happy coding! 🚀
