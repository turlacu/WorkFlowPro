# WorkFlow Pro - Architecture Overview

## Table of Contents
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Authentication & Authorization](#authentication--authorization)
- [API Architecture](#api-architecture)
- [Frontend Architecture](#frontend-architecture)
- [File Storage](#file-storage)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Monitoring & Observability](#monitoring--observability)

## System Architecture

WorkFlow Pro follows a modern full-stack architecture built with Next.js 13+ App Router, providing both server-side and client-side functionality in a single application.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  React Components | Next.js App Router | TailwindCSS        │
│  Radix UI | Recharts | React Hook Form | Zod Validation     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│       Next.js API Routes | Server Components               │
│       NextAuth.js | Role-based Access Control              │
│       Business Logic | File Processing                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│      Prisma ORM | SQLite/PostgreSQL | MinIO Storage        │
│      Database Migrations | Seeding | Backup System         │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Next.js 15.2.3** - Full-stack React framework with App Router
- **React 18.3.1** - UI library with modern hooks and concurrent features
- **TypeScript 5** - Static type checking and enhanced developer experience

### Database & ORM
- **Prisma 5.22.0** - Modern database toolkit with type-safe queries
- **SQLite** - Default database for development
- **PostgreSQL** - Recommended for production deployments

### Authentication
- **NextAuth.js 4.24.11** - Complete authentication solution
- **bcryptjs** - Password hashing and verification
- **Role-based Access Control** - ADMIN, PRODUCER, OPERATOR roles

### UI & Styling
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful & consistent icon library
- **next-themes** - Theme management (light/dark mode)

### Data Visualization
- **Recharts 2.15.1** - Composable charting library
- **React Hook Form 7.54.2** - Performant forms with validation
- **Zod 3.24.2** - TypeScript-first schema validation

### File Processing
- **xlsx 0.18.5** - Excel file reading and processing
- **MinIO 8.0.1** - Object storage for file uploads
- **Fuzzy Search (Fuse.js)** - Intelligent name matching

### Development Tools
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **Turbopack** - Fast development bundler

## Project Structure

```
WorkFlowPro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/             # Authenticated app routes
│   │   │   ├── assignments/   # Assignment management pages
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── settings/      # User settings and admin panel
│   │   │   ├── statistics/    # Analytics and reporting
│   │   │   └── todays-schedule/ # Daily schedule view
│   │   ├── actions/           # Server actions
│   │   ├── api/               # API routes (detailed below)
│   │   ├── login/             # Authentication pages
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── app/               # Application-specific components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # Reusable UI components (Radix-based)
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Next.js middleware
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Database schema definition
│   ├── migrations/            # Database migration files
│   └── seed.ts                # Database seeding script
├── public/                    # Static assets
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Documentation
└── backups/                   # Database backup storage
```

### API Route Organization

```
src/app/api/
├── admin/                     # Administrative endpoints
│   └── clear-database/        # Database reset
├── assignments/               # Assignment CRUD operations
│   └── [id]/                  # Individual assignment operations
├── auth/                      # Authentication endpoints
│   └── [...nextauth]/         # NextAuth.js handler
├── backup/                    # Backup and restore system
│   ├── [id]/                  # Individual backup operations
│   └── restore/               # Data restoration
├── debug/                     # Debug and diagnostics
├── health/                    # Health check endpoints
├── shift-color-legend/        # Color legend management
│   └── [id]/                  # Individual legend operations
├── team-schedule/             # Schedule management
│   ├── cleanup/               # Schedule cleanup
│   ├── debug/                 # Schedule debugging
│   └── upload-excel/          # Excel import functionality
├── upload/                    # File upload handling
├── user/                      # User-specific operations
│   ├── change-password/       # Password management
│   └── statistics/            # Personal statistics
└── users/                     # User management
    └── [id]/                  # Individual user operations
```

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    User     │       │   Assignment    │       │  TeamSchedule   │
├─────────────┤       ├─────────────────┤       ├─────────────────┤
│ id          │◄──────┤ assignedUserId  │       │ userId          │─────┐
│ name        │       │ createdById     │─────► │ date            │     │
│ email       │       │ title           │       │ timeRange       │     │
│ password    │       │ description     │       │ colorCode       │     │
│ role        │       │ status          │       │ createdAt       │     │
│ createdAt   │       │ priority        │       └─────────────────┘     │
│ updatedAt   │       │ dueDate         │                               │
└─────────────┘       │ comment         │       ┌─────────────────┐     │
                      │ createdAt       │       │ShiftColorLegend │     │
                      │ updatedAt       │       ├─────────────────┤     │
                      └─────────────────┘       │ id              │◄────┘
                                               │ colorCode       │
                                               │ shiftName       │
                                               │ startTime       │
                                               │ endTime         │
                                               │ description     │
                                               │ createdAt       │
                                               └─────────────────┘
```

### Key Relationships
- **User ↔ Assignment**: One-to-many (users can have multiple assignments)
- **User ↔ TeamSchedule**: One-to-many (users can have multiple schedule entries)
- **User ↔ Assignment (Creator)**: One-to-many (tracking who created assignments)
- **ShiftColorLegend ↔ TeamSchedule**: One-to-many (color codes map to schedules)

### Database Schema Highlights

#### User Entity
- **Role-based system**: ADMIN, PRODUCER, OPERATOR
- **Authentication**: Secure password hashing with bcrypt
- **Audit trail**: Creation and update timestamps

#### Assignment Entity
- **Status tracking**: PENDING, IN_PROGRESS, COMPLETED
- **Priority levels**: LOW, MEDIUM, HIGH
- **Comments system**: Operator feedback and updates
- **Dual relationship**: Assigned user vs. creator tracking

#### TeamSchedule Entity
- **Date-based scheduling**: Daily schedule entries
- **Time range storage**: Flexible time period representation
- **Color coding integration**: Links to shift color legends

#### ShiftColorLegend Entity
- **Color mapping**: Hex color codes to shift meanings
- **Time definitions**: Start and end times for shift types
- **Excel integration**: Supports automated color detection

## Authentication & Authorization

### Authentication Flow
1. **User Login** → NextAuth.js processes credentials
2. **Credential Validation** → Database lookup and password verification
3. **Session Creation** → JWT token with user role information
4. **Middleware Protection** → Route-level access control

### Authorization Matrix

| Role      | Users | Assignments | Schedules | Settings | Backup |
|-----------|-------|-------------|-----------|----------|--------|
| ADMIN     | CRUD  | CRUD        | CRUD      | CRUD     | CRUD   |
| PRODUCER  | Read  | CRUD        | CRUD      | Read     | None   |
| OPERATOR  | Read  | Read/Update | Read      | Self     | None   |

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Role Validation**: Server-side permission checking
- **Input Sanitization**: Zod schema validation

## API Architecture

### RESTful Design Principles
- **Resource-based URLs**: `/api/users`, `/api/assignments`
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Proper HTTP status code usage
- **JSON Communication**: Standardized request/response format

### API Response Format
```typescript
// Success Response
{
  data: T,
  message?: string
}

// Error Response
{
  error: string,
  code?: string,
  details?: any
}
```

### Middleware Stack
1. **CORS Handling** → Cross-origin request management
2. **Authentication Check** → Session validation
3. **Role Authorization** → Permission verification
4. **Input Validation** → Zod schema validation
5. **Error Handling** → Standardized error responses

### Advanced Features
- **File Upload Processing**: Excel parsing with color detection
- **Fuzzy Name Matching**: Intelligent user name resolution
- **Backup System**: Complete data export/import
- **Health Monitoring**: System status and diagnostics

## Frontend Architecture

### Component Architecture
```
Components/
├── ui/                        # Reusable UI primitives
│   ├── button.tsx            # Button component with variants
│   ├── dialog.tsx            # Modal and dialog components
│   ├── form.tsx              # Form handling components
│   └── ...                   # Other UI primitives
├── app/                      # Application-specific components
│   ├── assignment-table.tsx  # Assignment management
│   ├── excel-uploader.tsx    # File upload handling
│   ├── charts/               # Data visualization
│   └── ...                   # Feature components
└── providers/                # Context providers
    └── session-provider.tsx  # Authentication context
```

### State Management
- **Server State**: React Query for API data management
- **Client State**: React useState and useContext
- **Form State**: React Hook Form with Zod validation
- **Theme State**: next-themes for dark/light mode

### Rendering Strategy
- **Server Components**: Default for data fetching and initial render
- **Client Components**: Interactive elements and state management
- **Static Generation**: Documentation and static pages
- **Dynamic Rendering**: User-specific and real-time data

## File Storage

### MinIO Object Storage
```
Bucket: workflowpro
├── uploads/                  # User file uploads
│   ├── excel/               # Excel schedule files
│   └── temp/                # Temporary processing files
├── backups/                 # Database backup files
└── exports/                 # Generated export files
```

### Upload Flow
1. **Client Upload** → File validation and size checking
2. **Server Processing** → File type verification and processing
3. **MinIO Storage** → Secure object storage
4. **Database Reference** → File metadata storage
5. **Cleanup** → Temporary file removal

### File Processing Features
- **Excel Parsing**: .xlsx and .xls support with color detection
- **Image Processing**: Future support for avatars and attachments
- **Backup Generation**: Automated JSON backup creation
- **File Validation**: Type, size, and security checking

## Security Architecture

### Security Layers
1. **Transport Security**: HTTPS enforcement
2. **Authentication**: NextAuth.js with secure sessions
3. **Authorization**: Role-based access control
4. **Input Validation**: Zod schema validation
5. **Output Sanitization**: XSS prevention
6. **File Security**: Upload validation and scanning

### Security Best Practices
- **Password Policy**: Strong password requirements
- **Session Security**: HTTP-only, secure cookies
- **CSRF Protection**: Built-in Next.js protection
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **File Upload Security**: Type validation and size limits

### Vulnerability Mitigation
- **XSS Prevention**: React's built-in escaping
- **CSRF Protection**: Next.js middleware
- **Injection Attacks**: Prisma ORM protection
- **File Upload Attacks**: Strict validation and sandboxing

## Deployment Architecture

### Production Deployment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Next.js App   │    │   PostgreSQL    │
│    (Optional)   │◄──►│   (Container)   │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MinIO Object  │
                       │    Storage      │
                       └─────────────────┘
```

### Container Strategy
- **Docker Image**: Multi-stage build for optimization
- **Environment Variables**: Configuration management
- **Health Checks**: Kubernetes/Docker health monitoring
- **Horizontal Scaling**: Stateless application design

### Deployment Options
1. **Docker Compose**: Local and small-scale deployments
2. **Kubernetes**: Large-scale container orchestration
3. **Coolify**: Simplified deployment platform
4. **Vercel/Netlify**: Serverless deployment (with external database)

## Scalability Considerations

### Performance Optimizations
- **Database Indexing**: Optimized queries for large datasets
- **Caching Strategy**: Redis for session and data caching
- **CDN Integration**: Static asset optimization
- **Image Optimization**: Next.js automatic image optimization

### Horizontal Scaling
- **Stateless Design**: No server-side session storage
- **Database Scaling**: Read replicas and connection pooling
- **File Storage**: Distributed object storage
- **Load Balancing**: Multiple application instances

### Monitoring Points
- **Application Performance**: Response times and throughput
- **Database Performance**: Query performance and connection pool
- **Storage Performance**: File upload and processing times
- **User Experience**: Frontend performance metrics

## Monitoring & Observability

### Health Monitoring
- **Application Health**: `/api/health` endpoint
- **Database Health**: Connection and query monitoring
- **Storage Health**: MinIO availability checking
- **Dependency Health**: External service monitoring

### Logging Strategy
- **Application Logs**: Structured logging with timestamps
- **Error Tracking**: Comprehensive error logging
- **Audit Logs**: User action tracking
- **Performance Logs**: Slow query and operation tracking

### Metrics Collection
- **Business Metrics**: User activity and feature usage
- **Technical Metrics**: Response times and error rates
- **Infrastructure Metrics**: Resource utilization
- **Security Metrics**: Authentication and authorization events

### Future Enhancements
- **OpenTelemetry Integration**: Distributed tracing
- **Prometheus Metrics**: Time-series metrics collection
- **Grafana Dashboards**: Visual monitoring dashboards
- **Alert Management**: Automated incident response