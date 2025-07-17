#!/bin/bash

# Claude Code - Automated Deployment Helper
# This script is designed to be used by Claude to automatically deploy updates

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CLAUDE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[DEPLOYED]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[UPDATE]${NC} $1"
}

# Default commit message template
DEFAULT_MESSAGE="Update WorkFlow Pro application

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Get commit message from argument or use default
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

print_status "Claude Code is deploying updates to GitHub..."

# Check if there are any changes
if git diff-index --quiet HEAD --; then
    print_warning "No changes detected. Nothing to deploy."
    exit 0
fi

# Show what's being deployed
print_status "Changes to be deployed:"
git diff --name-status

# Stage all changes
git add .

# Commit with message
git commit -m "$COMMIT_MESSAGE"

# Push to main branch
git push origin main

print_success "✅ Updates deployed to GitHub successfully!"
print_success "🚀 Coolify will automatically redeploy the application."
print_success "📝 Commit: $(git log -1 --format='%h - %s')"

# Show GitHub repository info
REPO_URL=$(git remote get-url origin)
print_status "Repository: $REPO_URL"
print_status "Branch: main"
print_status "Coolify is now deploying your updates..."