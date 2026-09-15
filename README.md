# Task Manager API - Comprehensive NestJS Backend

A full-featured NestJS backend demonstrating all major NestJS concepts including modules, entities, DTOs, validation, authentication, authorization, guards, interceptors, filters, middleware, pipes, decorators, and testing.

## 🎯 Project Overview

This Task Manager API showcases a production-ready NestJS application with:
- **PostgreSQL database** with TypeORM
- **JWT authentication** with Passport
- **Role-based authorization** (Admin/Member)
- **Complete CRUD operations** for Users, Projects, and Tasks
- **Swagger/OpenAPI documentation**
- **Comprehensive testing** (unit + e2e)
- **Global validation, error handling, and logging**

## 🏗️ Architecture & NestJS Concepts Demonstrated

### 1. **Modules** (Feature-based Organization)
- `AuthModule` - Authentication logic
- `UsersModule` - User management
- `ProjectsModule` - Project management
- `TasksModule` - Task management
- `CommonModule` - Shared utilities

Each module encapsulates related functionality following the single responsibility principle.

### 2. **Entities** (TypeORM)
- `User`, `Project`, `Task` entities with proper relations
- **OneToMany** / **ManyToOne** relationships
- Enum types (`UserRole`, `TaskStatus`)
- Timestamps and soft deletes support

### 3. **DTOs** (Data Transfer Objects)
- Input validation with `class-validator`
- API documentation with `@ApiProperty` decorators
- `PartialType` for update DTOs
- Automatic transformation and sanitization

### 4. **Authentication** (JWT + Passport)
- JWT-based stateless authentication
- Password hashing with bcrypt
- `JwtStrategy` for token validation
- Protected routes by default

### 5. **Authorization** (Role-based)
- Custom `@Roles()` decorator
- `RolesGuard` for role checking
- Fine-grained permissions (admin-only operations)
- Task assignee validation

### 6. **Custom Decorators**
- `@Public()` - Bypass authentication
- `@CurrentUser()` - Extract authenticated user
- `@Roles()` - Define required roles

### 7. **Guards**
- `JwtAuthGuard` - Global authentication (applied via `APP_GUARD`)
- `RolesGuard` - Role-based authorization
- Demonstrates guard execution order and metadata reflection

### 8. **Pipes**
- Global `ValidationPipe` with whitelist and transform
- `ParseUUIDPipe` for route parameter validation
- Automatic DTO validation on all endpoints

### 9. **Interceptors**
- `LoggingInterceptor` - Logs response times
- `TransformInterceptor` - Wraps responses as `{ success: true, data: ... }`
- Demonstrates RxJS operators (`tap`, `map`)

### 10. **Exception Filters**
- `HttpExceptionFilter` - Global error formatting
- Consistent error responses: `{ success: false, statusCode, message, timestamp }`
- Error logging

### 11. **Middleware**
- `LoggerMiddleware` - Logs incoming requests
- Demonstrates the difference between middleware and interceptors
- Applied globally to all routes

### 12. **Configuration** (@nestjs/config)
- Environment variables with `.env`
- Type-safe configuration service
- Async module configuration for JWT and TypeORM

### 13. **Swagger/OpenAPI**
- Complete API documentation at `/docs`
- Bearer authentication configured
- Try-it-out functionality for all endpoints
- Request/response schemas

### 14. **Lifecycle Hooks**
- `OnModuleInit` in `AppModule`
- Logs when database connection is established

### 15. **Testing**
- **Unit tests**: Mocked repository for `TasksService`
- **E2E tests**: Full application flow from registration to task management
- Demonstrates Vitest with NestJS

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=taskmanager

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

### 3. Create Database

Create a PostgreSQL database named `taskmanager`:

```bash
# Using psql
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

Or use any PostgreSQL client (pgAdmin, DBeaver, etc.)

### 4. Run Database Migrations

The application uses TypeORM's `synchronize: true` for development, which automatically creates tables:

```bash
npm run start:dev
```

**⚠️ Note**: Set `synchronize: false` in production and use proper migrations!

### 5. Seed the Database

Populate the database with sample data:

```bash
npm run seed
```

This creates:
- **3 users**: 1 admin + 2 members
- **2 projects**: Each with different owners
- **4 tasks**: Distributed across projects

**Test Credentials:**
```
Admin:  admin@example.com / password123
User 1: john@example.com / password123
User 2: jane@example.com / password123
```

## 🏃 Running the Application

### Development Mode (with hot reload)

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/docs

## 📚 API Documentation

Open http://localhost:3000/docs to view the interactive Swagger documentation.

### Available Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token

#### Users
- `GET /users/me` - Get current user profile

#### Projects
- `POST /projects` - Create a project
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID
- `DELETE /projects/:id` - Delete project (admin only)

#### Tasks
- `POST /projects/:id/tasks` - Create a task for a project
- `GET /projects/:id/tasks` - Get all tasks for a project
- `PATCH /tasks/:id` - Update task (assignee or admin)
- `DELETE /tasks/:id` - Delete task (assignee or admin)

### Using Swagger UI

1. Open http://localhost:3000/docs
2. Click on `POST /auth/login`
3. Try it out with test credentials
4. Copy the `access_token` from the response
5. Click the "Authorize" button (top right)
6. Enter: `Bearer YOUR_ACCESS_TOKEN`
7. Now you can test all protected endpoints!

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

This runs the unit test for `TasksService` with mocked repositories.

### Run E2E Tests

```bash
npm run test:e2e
```

This runs the full end-to-end test that:
1. Registers a user
2. Logs in
3. Creates a project
4. Creates a task
5. Updates the task
6. Fetches data
7. Validates authorization

### Run Tests with Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## 📁 Project Structure

```
src/
├── auth/
│   ├── dto/                    # Login/Register DTOs
│   ├── strategies/             # JWT Strategy
│   ├── auth.controller.ts      # Auth endpoints
│   ├── auth.service.ts         # Auth business logic
│   └── auth.module.ts          # Auth module
├── users/
│   ├── dto/                    # User DTOs
│   ├── entities/               # User entity
│   ├── users.controller.ts     # User endpoints
│   ├── users.service.ts        # User business logic
│   └── users.module.ts         # Users module
├── projects/
│   ├── dto/                    # Project DTOs
│   ├── entities/               # Project entity
│   ├── projects.controller.ts  # Project endpoints
│   ├── projects.service.ts     # Project business logic
│   └── projects.module.ts      # Projects module
├── tasks/
│   ├── dto/                    # Task DTOs
│   ├── entities/               # Task entity
│   ├── tasks.controller.ts     # Task endpoints
│   ├── tasks.service.ts        # Task business logic
│   ├── tasks.service.spec.ts   # Unit tests
│   └── tasks.module.ts         # Tasks module
├── common/
│   ├── decorators/             # Custom decorators
│   │   ├── public.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/                 # Authentication & authorization
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/           # Request/response handling
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── filters/                # Error handling
│   │   └── http-exception.filter.ts
│   ├── middleware/             # Request preprocessing
│   │   └── logger.middleware.ts
│   └── common.module.ts
├── database/
│   └── seed.ts                 # Database seeding script
├── app.module.ts               # Root module
└── main.ts                     # Application entry point

test/
└── app.e2e-spec.ts            # End-to-end tests
```

## 🔑 Key Features Explained

### Global ValidationPipe

Automatically validates all DTOs and strips unknown properties:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Remove non-whitelisted properties
    transform: true,           // Transform to DTO instances
    forbidNonWhitelisted: true // Throw error on extra properties
  })
);
```

### Response Format

All successful responses are wrapped:

```json
{
  "success": true,
  "data": { /* your data */ }
}
```

All errors are formatted:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "timestamp": "2026-09-15T12:00:00.000Z",
  "path": "/projects"
}
```

### Authentication Flow

1. User registers or logs in → receives JWT token
2. Client includes token in header: `Authorization: Bearer TOKEN`
3. `JwtAuthGuard` validates token automatically
4. `JwtStrategy` loads user from database
5. User object available via `@CurrentUser()` decorator

### Authorization Levels

- **Public**: Login, Register (using `@Public()`)
- **Authenticated**: All other routes (default)
- **Role-based**: Delete project (admin only, using `@Roles(UserRole.ADMIN)`)
- **Resource-based**: Update/delete task (assignee or admin, checked in service)

## 🛠️ Development Tips

### Adding a New Feature Module

```bash
nest generate module features/feature-name
nest generate service features/feature-name
nest generate controller features/feature-name
```

### Creating a New Entity

1. Create entity in `entities/` folder
2. Add to TypeORM configuration in `app.module.ts`
3. Run the app to auto-generate the table

### Custom Decorators

See `src/common/decorators/` for examples of:
- Metadata decorators (`@Roles()`)
- Param decorators (`@CurrentUser()`)

### Middleware vs Interceptors vs Guards

- **Middleware**: Runs first, before routing, no access to execution context
- **Guards**: Runs after middleware, determines if request proceeds
- **Interceptors**: Runs before/after handler, can transform request/response

Order: Middleware → Guards → Interceptors → Handler → Interceptors

## 🚨 Common Issues

### Database Connection Failed

- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check if database exists

### Port Already in Use

Change the port in `.env`:
```env
PORT=3001
```

### JWT Token Expired

Tokens expire based on `JWT_EXPIRES_IN` in `.env`. Get a new token by logging in again.

## 📦 Production Considerations

Before deploying to production:

1. **Disable TypeORM synchronize**:
   ```typescript
   synchronize: false
   ```

2. **Use proper migrations**:
   ```bash
   npm run typeorm migration:generate
   npm run typeorm migration:run
   ```

3. **Change JWT secret**: Use a strong, random secret

4. **Enable CORS** if needed:
   ```typescript
   app.enableCors();
   ```

5. **Add rate limiting**:
   ```bash
   npm install @nestjs/throttler
   ```

6. **Add helmet for security headers**:
   ```bash
   npm install helmet
   ```

7. **Set up proper logging** (Winston, Pino)

8. **Use environment-specific configs**

## 📖 Learning Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

## 📝 License

This project is [UNLICENSED]().

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your own learning!

---

**Built with NestJS** 🐱
