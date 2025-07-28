# WorkFlow Pro

A comprehensive work assignment and team scheduling application built with Next.js, designed to help organizations manage their workflow efficiently with role-based access control and advanced Excel integration.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login with role-based access (Admin, Producer, Operator)
- **Assignment Management** - Create, assign, and track work assignments with status updates
- **Team Scheduling** - Interactive calendar with color-coded shift management
- **Excel Integration** - Advanced Excel import with color detection and fuzzy name matching
- **Statistics & Analytics** - Comprehensive reporting with charts and productivity metrics
- **Data Backup & Restore** - Complete system backup and restoration capabilities

### User Roles
- **👑 Admin** - Full system access, user management, and system configuration
- **🏭 Producer** - Assignment and schedule management, Excel imports
- **👷 Operator** - Task completion, status updates, and personal statistics

### Advanced Features
- **Interactive Calendar** - Visual schedule overview with color-coded shifts
- **Excel Schedule Import** - Bulk import with automatic color legend detection
- **Real-time Updates** - Dynamic status tracking and notifications
- **Multi-language Support** - English and Romanian language options
- **Dark/Light Theme** - User preference theme switching
- **Responsive Design** - Mobile-friendly interface

## 🛠️ Technology Stack

- **Framework**: Next.js 15.2.3 with App Router
- **Language**: TypeScript 5
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: NextAuth.js with role-based access control
- **UI**: TailwindCSS + Radix UI components
- **Charts**: Recharts for data visualization
- **File Storage**: MinIO object storage
- **Excel Processing**: Advanced .xlsx/.xls parsing with color detection

## 📚 Documentation

- **[API Documentation](./API.md)** - Complete API reference and endpoints
- **[Development Setup](./DEVELOPMENT.md)** - Local development and deployment guide
- **[User Guide](./USER_GUIDE.md)** - Comprehensive user manual
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and technical details
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WorkFlowPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   Navigate to `http://localhost:3000`

### Default Admin Login
- **Email**: `admin@workflowpro.com`
- **Password**: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

## 📁 Project Structure

```
WorkFlowPro/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (app)/          # Protected app routes
│   │   ├── api/            # API endpoints
│   │   └── login/          # Authentication
│   ├── components/         # React components
│   │   ├── app/           # App-specific components
│   │   ├── ui/            # Reusable UI components
│   │   └── providers/     # Context providers
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema & migrations
├── docs/                  # Documentation
├── scripts/               # Deployment scripts
└── public/                # Static assets
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:migrate     # Apply database migrations
npm run db:seed        # Seed database with initial data
npm run db:reset       # Reset database (destructive)

# Code Quality
npm run lint           # Run ESLint
npm run typecheck      # Run TypeScript checks
```

## 📊 Key Features Walkthrough

### Assignment Management
- Create and assign tasks to team members
- Track progress with status updates (Pending, In Progress, Completed)
- Priority levels and due date management
- Comment system for operator feedback

### Team Scheduling
- Interactive calendar interface
- Color-coded shift visualization
- Bulk Excel import with intelligent processing
- Automatic color legend generation

### Excel Integration
- Support for .xlsx and .xls formats
- Advanced color detection algorithms
- Fuzzy name matching to existing users
- Preview mode before importing
- Comprehensive error reporting

### Statistics & Reporting
- Personal and team productivity metrics
- Visual charts and trend analysis
- Customizable date range filtering
- Role-specific dashboard views

## 🐳 Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Manual Docker build
docker build -t workflowpro .
docker run -p 3000:3000 workflowpro
```

## 🔒 Security Features

- **Authentication**: Secure session management with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Zod schema validation for all inputs
- **File Security**: Upload validation and size limits
- **CSRF Protection**: Built-in Next.js CSRF protection

## 🌟 Production Considerations

- **Database**: Switch to PostgreSQL for production
- **File Storage**: Configure MinIO or S3-compatible storage
- **Environment**: Set up proper environment variables
- **Monitoring**: Implement health checks and logging
- **Backup**: Schedule regular database backups
- **SSL**: Enable HTTPS with proper certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions

## 🎯 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with external calendar systems
- [ ] Real-time notifications and messaging
- [ ] Advanced workflow automation
- [ ] Multi-tenant support
- [ ] API rate limiting and monitoring
- [ ] Advanced audit logging
