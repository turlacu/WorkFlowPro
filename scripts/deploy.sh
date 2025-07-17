#!/bin/bash

# WorkFlow Pro - Automated GitHub Deployment Script
# This script handles automated commits and pushes to GitHub
# Coolify will automatically deploy from the main branch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
    print_error "This script must be run from the WorkFlowPro root directory!"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin &>/dev/null; then
    print_error "No remote origin found. Please add your GitHub repository:"
    print_error "git remote add origin https://github.com/YOUR_USERNAME/WorkFlowPro.git"
    exit 1
fi

# Get commit message from argument or use default
COMMIT_MESSAGE="$1"
if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Update WorkFlow Pro application

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

print_status "Starting deployment process..."

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_status "Uncommitted changes detected. Adding files..."
    
    # Add all changes
    git add .
    
    # Show what's being committed
    print_status "Files to be committed:"
    git diff --cached --name-status
    
    # Commit changes
    print_status "Committing changes..."
    git commit -m "$COMMIT_MESSAGE"
    print_success "Changes committed successfully!"
else
    print_warning "No changes to commit."
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git push origin main

print_success "✅ Deployment completed successfully!"
print_success "🚀 Coolify will automatically deploy the changes."
print_success "📦 Latest commit: $(git log -1 --format='%h - %s')"
print_success "🔗 Repository: $(git remote get-url origin)"

# Show deployment status
print_status "Deployment Summary:"
echo "  - Repository: $(git remote get-url origin)"
echo "  - Branch: main"
echo "  - Last commit: $(git log -1 --format='%h - %s (%ar)' --date=relative)"
echo "  - Coolify will automatically detect and deploy this update"

print_status "🎉 All done! Check your Coolify dashboard for deployment status."