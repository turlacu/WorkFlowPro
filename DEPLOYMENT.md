# WorkFlow Pro - Deployment Guide

## 🚀 Automated GitHub + Coolify Deployment Workflow

This guide explains how to set up automatic deployment from GitHub to Coolify, allowing seamless updates whenever code changes are pushed.

## 📋 Prerequisites

- GitHub account and repository
- Coolify instance running on your Ubuntu server
- Domain name (optional, but recommended)

## 🔧 Setup Process

### Step 1: GitHub Repository Setup

1. **Create GitHub Repository**
   ```bash
   # Repository should already be initialized
   git remote add origin https://github.com/YOUR_USERNAME/WorkFlowPro.git
   git push -u origin main
   ```

2. **Configure Repository Settings**
   - Enable Actions in repository settings
   - Set up branch protection for `main` branch
   - Add repository topics: `nextjs`, `typescript`, `postgresql`, `docker`, `prisma`

### Step 2: Coolify Configuration

1. **Add New Project in Coolify**
   - Go to your Coolify dashboard
   - Click "New Project"
   - Select "Deploy from Git"
   - Connect your GitHub repository

2. **Environment Variables**
   Set these in Coolify's environment section:
   
   **Required:**
   ```env
   DATABASE_URL=postgresql://workflowpro:workflowpro123@postgres:5432/workflowpro
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
   NODE_ENV=production
   ```
   
   **Optional:**
   ```env
   MINIO_ENDPOINT=minio:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin123
   MINIO_BUCKET_NAME=workflowpro-storage
   REDIS_URL=redis://redis:6379
   ```

3. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3000`
   - **Dockerfile**: Use the provided Dockerfile

4. **Set Up Services**
   Coolify will automatically create services based on `docker-compose.yml`:
   - PostgreSQL database
   - Redis cache
   - MinIO storage
   - Main application

### Step 3: Database Migration

During first deployment, Coolify will:
1. Run database migrations: `npx prisma migrate deploy`
2. Seed the database: `npx prisma db seed`

## 🔄 Automated Deployment Workflow

### For Claude Code (Automated Updates)

When I make changes to your application, I'll use the automated deployment script:

```bash
./scripts/claude-deploy.sh "Description of changes made"
```

This will:
1. ✅ Commit all changes to git
2. 🚀 Push to GitHub main branch
3. 🔄 Trigger Coolify automatic deployment
4. 📦 Deploy the updated application

### For Manual Updates

You can also deploy manually:

```bash
# Make your changes
git add .
git commit -m "Your commit message"
git push origin main

# Or use the deploy script
./scripts/deploy.sh "Your commit message"
```

### Deployment Process

1. **GitHub Push** → Code pushed to main branch
2. **GitHub Actions** → Runs CI/CD pipeline (lint, test, build)
3. **Coolify Webhook** → Detects changes and pulls latest code
4. **Build Process** → Creates Docker image
5. **Database Migration** → Runs Prisma migrations
6. **Deployment** → Replaces old container with new one
7. **Health Check** → Verifies deployment success

## 🔍 Monitoring Deployment

### GitHub Actions
- Check workflow status: `https://github.com/YOUR_USERNAME/WorkFlowPro/actions`
- View build logs and test results

### Coolify Dashboard
- Monitor deployment progress
- View application logs
- Check service health status
- Manage environment variables

### Health Check
- Application health: `https://your-domain.com/api/health`
- Database status included in response

## 📊 Post-Deployment Verification

After each deployment, verify:

1. **Application Access**
   - ✅ Login page loads: `https://your-domain.com/login`
   - ✅ Authentication works with seed users
   - ✅ Dashboard accessible after login

2. **Database Connection**
   - ✅ Health check passes: `https://your-domain.com/api/health`
   - ✅ Assignment creation/editing works
   - ✅ User management functions

3. **File Storage**
   - ✅ MinIO accessible (if configured)
   - ✅ File uploads work

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failure**
   - Check GitHub Actions logs
   - Verify all dependencies are installed
   - Ensure TypeScript compilation passes

2. **Database Connection Error**
   - Verify DATABASE_URL in Coolify
   - Check PostgreSQL service status
   - Ensure migrations ran successfully

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Ensure database is seeded with users

### Rollback Process

If deployment fails:
1. Check Coolify logs for error details
2. Rollback to previous deployment in Coolify
3. Fix issues and redeploy

## 📈 Scaling Considerations

For production scaling:
- Enable Redis caching
- Configure MinIO clustering
- Set up database connection pooling
- Implement CDN for static assets

## 🔐 Security Checklist

- [ ] NEXTAUTH_SECRET is secure and unique
- [ ] Database credentials are strong
- [ ] MinIO access keys are changed from defaults
- [ ] HTTPS is enabled via Coolify
- [ ] Environment variables are properly secured

## 📝 Default Login Credentials

**After deployment, you can login with:**
- **Admin**: admin@workflowpro.com / admin123
- **Producer**: adrian.doros@workflowpro.com / producer123
- **Operator**: alina.doncea@workflowpro.com / operator123

**⚠️ Important:** Change these credentials immediately after first login!

## 🎉 Success!

Your WorkFlow Pro application is now set up with automatic deployment. Any changes pushed to GitHub will automatically trigger a new deployment through Coolify.