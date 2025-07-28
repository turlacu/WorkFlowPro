# WorkFlow Pro - Development Setup Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Development Commands](#development-commands)
- [Docker Development](#docker-development)
- [Database Management](#database-management)
- [File Upload Configuration](#file-upload-configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)

## Prerequisites

Before setting up the development environment, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Docker** and **Docker Compose** (for containerized development)
- **SQLite** (for local database, or PostgreSQL for production)

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WorkFlowPro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Copy the example environment file and configure it:
```bash
cp .env.example .env.local
```

See [Environment Configuration](#environment-configuration) for detailed setup.

### 4. Initialize the Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Setup

### SQLite (Development)
The application uses SQLite by default for local development. The database file is created at `prisma/data.db`.

### PostgreSQL (Production)
For production or if you prefer PostgreSQL locally:

1. Install PostgreSQL
2. Create a database: `CREATE DATABASE workflowpro;`
3. Update `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/workflowpro"
   ```

### Database Schema
The database schema is managed with Prisma. Key entities include:
- `User` - User accounts with roles (ADMIN, PRODUCER, OPERATOR)
- `Assignment` - Work assignments with status tracking
- `TeamSchedule` - Team scheduling data
- `ShiftColorLegend` - Color mapping for Excel imports

## Environment Configuration

Create a `.env.local` file with the following variables:

### Required Variables
```env
# Database
DATABASE_URL="file:./data.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Application Settings
NODE_ENV="development"
```

### Optional Variables
```env
# MinIO Configuration (for file uploads)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
MINIO_BUCKET_NAME="workflowpro"

# Email Configuration (if implementing email features)
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@workflowpro.com"

# Additional Security
ALLOWED_ORIGINS="http://localhost:3000"
```

### Generating Secrets
Generate a secure secret for NextAuth:
```bash
openssl rand -base64 32
```

## Running the Application

### Development Mode
```bash
npm run dev
```
- Starts Next.js in development mode with hot reloading
- Uses Turbopack for faster builds
- Available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Default Admin Account
After seeding the database, you can log in with:
- **Email:** `admin@workflowpro.com`
- **Password:** `admin123`

**⚠️ Important:** Change the default password immediately in production!

## Development Commands

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Reset database (⚠️ Destructive)
npm run db:reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Fix auto-fixable linting issues
npm run lint -- --fix
```

### Build and Deployment
```bash
# Create production build
npm run build

# Start production server
npm start

# Build and run database setup (production)
npm run build
```

## Docker Development

### Using Docker Compose
The project includes Docker configuration for containerized development:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache
```

### Docker Services
- **app** - Next.js application
- **database** - PostgreSQL database (if configured)
- **minio** - Object storage for file uploads

### Environment for Docker
When using Docker, ensure your `.env` file uses appropriate hostnames:
```env
DATABASE_URL="postgresql://postgres:password@database:5432/workflowpro"
MINIO_ENDPOINT="minio"
```

## Database Management

### Migrations
When modifying the database schema:

1. Update the Prisma schema in `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```
3. The migration files are created in `prisma/migrations/`

### Seeding
The seed script (`prisma/seed.ts`) creates:
- Default admin user
- Sample data for development
- Default shift color legends

Customize the seed data as needed for your development workflow.

### Backup and Restore
Use the built-in backup system through the web interface or API:
- Access `/api/admin` routes for backup operations
- Backup files are stored in the `backups/` directory

## File Upload Configuration

### MinIO Setup (Recommended)
1. Install MinIO locally or use Docker:
   ```bash
   docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
   ```

2. Access MinIO console at `http://localhost:9001`
3. Create a bucket named `workflowpro`
4. Configure environment variables as shown above

### File Storage
- Excel files for schedule imports
- Backup files
- Future: User avatars, attachments

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Reset database
npm run db:reset

# Regenerate Prisma client
npx prisma generate

# Check database file permissions (SQLite)
ls -la prisma/data.db
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run typecheck
```

#### File Upload Issues
1. Verify MinIO is running and accessible
2. Check bucket exists and permissions
3. Validate environment variables
4. Check file size limits (default: 10MB)

#### Authentication Issues
1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and session storage
4. Check database for user records

### Debug Endpoints
Use these endpoints for troubleshooting:
- `GET /api/health` - System health check
- `GET /api/debug` - Debug information (admin only)
- `GET /api/status` - Environment status

### Logging
- Application logs are output to console in development
- Database queries can be logged by setting `DATABASE_LOG_LEVEL=debug`
- Check browser network tab for API errors

## Contributing Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Component Structure
- Place reusable components in `src/components/ui/`
- App-specific components in `src/components/app/`
- Use proper TypeScript interfaces
- Follow existing naming conventions

### API Development
- All API routes in `src/app/api/`
- Use Zod for request validation
- Implement proper error handling
- Follow RESTful conventions
- Add appropriate authentication checks

### Database Changes
- Always create migrations for schema changes
- Update seed data if needed
- Test migrations on clean database
- Document breaking changes

### Testing
While not currently implemented, consider adding:
- Unit tests with Jest
- Integration tests for API routes
- E2E tests with Playwright
- Component tests with React Testing Library

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with proper commits
3. Run linting and type checking
4. Test locally with clean database
5. Update documentation if needed
6. Submit pull request with description

### Development Best Practices
- Use absolute imports with `@/` prefix
- Implement proper error boundaries
- Use React Server Components where possible
- Optimize bundle size and performance
- Follow accessibility guidelines
- Implement proper loading states

## Deployment Scripts

The project includes several deployment scripts in the `scripts/` directory:
- `setup-dev.sh` - Development environment setup
- `deploy.sh` - Production deployment
- `quick-deploy.sh` - Fast deployment for updates
- `claude-deploy.sh` - Automated deployment script

Review and customize these scripts for your deployment environment.