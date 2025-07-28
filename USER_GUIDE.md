# WorkFlow Pro - User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Login and Authentication](#login-and-authentication)
- [Dashboard Overview](#dashboard-overview)
- [Assignment Management](#assignment-management)
- [Team Schedule](#team-schedule)
- [Excel Schedule Import](#excel-schedule-import)
- [Statistics and Reporting](#statistics-and-reporting)
- [User Management (Admin)](#user-management-admin)
- [Settings and Preferences](#settings-and-preferences)
- [Data Backup and Restore (Admin)](#data-backup-and-restore-admin)
- [Troubleshooting](#troubleshooting)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

WorkFlow Pro is a comprehensive work assignment and team scheduling application designed to help organizations manage their workflow efficiently. The application supports different user roles with specific permissions and features.

### First Time Setup
1. Access the application through your web browser
2. Log in with your provided credentials
3. Change your default password if required
4. Familiarize yourself with the interface based on your role

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- JavaScript enabled

## User Roles

WorkFlow Pro supports three distinct user roles:

### 👑 Admin
**Full system access with all permissions:**
- User management (create, edit, delete users)
- System configuration and settings
- Database backup and restore
- Access to all features and data
- System health monitoring

### 🏭 Producer
**Assignment and schedule management:**
- Create and manage work assignments
- Upload and manage team schedules
- View all team data and statistics
- Manage shift color legends
- Access to advanced Excel import features

### 👷 Operator
**Task execution and completion:**
- View assigned tasks
- Update assignment status and add comments
- View team schedules
- Access personal statistics
- Complete assigned work

## Login and Authentication

### Logging In
1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"

### Default Admin Account
- **Email:** `admin@workflowpro.com`
- **Password:** `admin123`
- **⚠️ Important:** Change this password immediately after first login

### Password Management
- Users can change their password through Settings
- Current password verification is required
- Use strong passwords with mixed characters

### Session Management
- Sessions remain active during browser usage
- Automatic logout after extended inactivity
- "Remember me" option for convenience

## Dashboard Overview

The dashboard provides different views based on your user role:

### Main Navigation
- **Dashboard** - Overview and quick actions
- **Assignments** - Task management
- **Today's Schedule** - Current day's schedule
- **Statistics** - Reports and analytics
- **Settings** - User preferences and system settings

### Header Features
- **User Information** - Displays current logged-in user and role
- **Theme Toggle** - Switch between light and dark mode
- **Language Toggle** - Switch between English and Romanian
- **Logout** - Secure session termination

### Dashboard Widgets
- **Recent Assignments** - Latest tasks and their status
- **Today's Schedule** - Current day's scheduling information
- **Quick Stats** - Key metrics and numbers
- **Interactive Calendar** - Visual schedule overview

## Assignment Management

### Viewing Assignments
- **Assignment Table** - Displays all assignments with filtering options
- **Status Indicators:**
  - 🔴 **Red** - Urgent/overdue assignments
  - 🟢 **Green** - Completed assignments
  - 💬 **Comment Icon** - Assignments with comments
- **Search and Filter** - Find assignments by title, description, or date

### Creating Assignments (Producer/Admin)
1. Click "New Assignment" button
2. Fill in the assignment details:
   - **Title** - Brief description of the task
   - **Description** - Detailed instructions
   - **Due Date** - Deadline for completion
   - **Assigned User** - Select from available operators
   - **Priority** - Set as Low, Medium, or High
3. Click "Create Assignment"

### Managing Assignments
- **Edit** - Modify assignment details (creator or admin only)
- **Update Status** - Change between Pending, In Progress, Completed
- **Add Comments** - Provide updates or notes
- **Delete** - Remove assignments (admin/creator only)

### Assignment Details Modal
Click on any assignment to view:
- Complete assignment information
- Assignment history and updates
- Comments from users
- Status change timeline

## Team Schedule

### Viewing Schedules
- **Calendar View** - Interactive calendar showing scheduled work
- **Color Coding** - Different colors represent different shift types
- **Date Selection** - Click dates to view specific day details
- **Schedule Table** - List view of all schedule entries

### Schedule Features
- **Time Ranges** - Displays start and end times for shifts
- **User Assignment** - Shows which team members are scheduled
- **Shift Types** - Different categories of work (day, night, overtime, etc.)
- **Color Legend** - Understanding the color-coding system

### Today's Schedule Page
- **Current Day Focus** - Dedicated view for today's assignments
- **Real-time Updates** - Reflects current status changes
- **Quick Actions** - Fast access to common tasks

## Excel Schedule Import

This powerful feature allows bulk importing of team schedules from Excel files.

### Supported Formats
- **Excel Files** - .xlsx and .xls formats
- **CSV Files** - Comma-separated values
- **Color Detection** - Automatically detects cell background colors

### Import Process
1. **Navigate to Settings** → **Excel Schedule Uploader**
2. **Select File** - Choose your Excel file
3. **Preview Import** - Review detected data before import
4. **Color Legend Mapping** - Assign meaning to detected colors
5. **Name Matching** - System attempts to match names to existing users
6. **Confirm Import** - Complete the import process

### Excel File Requirements
- **Column Headers** - Clearly labeled columns (Name, Date, etc.)
- **Date Format** - Consistent date formatting
- **User Names** - Names that match or can be fuzzy-matched to existing users
- **Color Coding** - Use cell background colors for shift types

### Import Results
After import, you'll see:
- **Matched Users** - Successfully matched names
- **Unmatched Entries** - Names that couldn't be matched
- **Created Schedules** - Number of schedule entries created
- **Color Legends** - New shift types detected and created

### Best Practices
- Ensure user names in Excel match system names
- Use consistent color coding throughout the file
- Review and clean data before importing
- Test with small files first

## Statistics and Reporting

### Personal Statistics
All users can view their own statistics:
- **Assignments Completed** - Total and over time periods
- **Productivity Metrics** - Completion rates and patterns
- **Activity Timeline** - Work patterns and trends

### Producer/Admin Statistics
Extended statistics for management roles:
- **Team Overview** - Overall team performance
- **Assignment Creation** - Tasks created and managed
- **Completion Analytics** - Team productivity insights
- **Busiest Periods** - Peak activity times and dates

### Chart Types
- **Daily Completions Pie Chart** - Task completion breakdown
- **Monthly Trends** - Long-term productivity patterns
- **Assignments by Status** - Current workload distribution
- **User Activity** - Individual and team comparisons

### Filtering Options
- **Date Range** - Custom time periods
- **User Selection** - Focus on specific team members
- **Assignment Type** - Filter by categories
- **Status Filtering** - View specific task states

## User Management (Admin)

### User List
- View all system users
- Filter by role (Admin, Producer, Operator)
- Search by name or email
- Sort by various criteria

### Creating Users
1. Click "Add New User"
2. Enter user information:
   - **Name** - Full name
   - **Email** - Must be unique
   - **Password** - Temporary password
   - **Role** - Select appropriate role
3. Save the new user

### Managing Users
- **Edit** - Modify user information and roles
- **Delete** - Remove users (cannot delete yourself)
- **Role Changes** - Promote or demote user permissions
- **Password Reset** - Administrators can reset user passwords

### User Security
- Email addresses must be unique
- Strong password requirements
- Role-based access control
- Activity logging and monitoring

## Settings and Preferences

### User Settings
- **Change Password** - Update your login credentials
- **Profile Information** - Update name and email
- **Language Preference** - English or Romanian
- **Theme Selection** - Light or dark mode

### System Settings (Admin)
- **Shift Color Legend Management** - Configure schedule color codes
- **System Configuration** - Database and application settings
- **Backup Management** - Create and manage system backups
- **User Administration** - Manage all system users

### Shift Color Legend
Manage the color coding system for schedules:
- **Add New Colors** - Define new shift types
- **Edit Existing** - Modify color meanings
- **Time Ranges** - Set start and end times for shifts
- **Color Codes** - Hex color values for visual representation

## Data Backup and Restore (Admin)

### Creating Backups
1. Navigate to Settings → Backup Management
2. Click "Create Backup"
3. System creates timestamped backup file
4. Download backup file for safekeeping

### Backup Contents
- All user accounts (passwords excluded)
- Complete assignment history
- Team schedule data
- Shift color legend configurations
- System settings

### Restoring Data
1. Access Backup Management
2. Upload backup file
3. System validates backup integrity
4. Confirm restoration process
5. System restores data while preserving admin account

### Backup Management
- **List Backups** - View all available backups
- **Download** - Save backup files locally
- **Delete Old Backups** - Clean up storage space
- **Automatic Backups** - Scheduled backup creation (if configured)

## Troubleshooting

### Common Issues

#### Cannot Log In
- Verify email and password are correct
- Check for caps lock or typing errors
- Contact administrator for password reset
- Clear browser cache and cookies

#### Assignment Not Loading
- Refresh the page
- Check internet connection
- Verify you have permission to view the assignment
- Contact system administrator

#### Excel Import Failing
- Verify file format (.xlsx, .xls, .csv)
- Check file size (maximum 10MB)
- Ensure data format is correct
- Review error messages for specific issues

#### Schedule Not Displaying
- Check date filters and selections
- Verify schedule data exists for selected period
- Refresh the page
- Clear browser cache

### Performance Issues
- Close unnecessary browser tabs
- Clear browser cache and history
- Check internet connection speed
- Contact administrator for server issues

### Error Messages
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Server Error** - Contact system administrator
- **File Too Large** - Reduce file size and retry

### Getting Help
1. Check this user guide for solutions
2. Contact your system administrator
3. Report persistent issues with detailed descriptions
4. Include error messages and steps to reproduce issues

## Keyboard Shortcuts

### General Navigation
- **Tab** - Move between form fields
- **Enter** - Submit forms or confirm actions
- **Escape** - Close modals and dialogs
- **Ctrl+R** - Refresh current page

### Assignment Management
- **N** - New assignment (when available)
- **E** - Edit assignment (in detail view)
- **Delete** - Delete assignment (with confirmation)

### Calendar Navigation
- **Arrow Keys** - Navigate calendar dates
- **Home** - Go to current date
- **Page Up/Down** - Navigate months

### Accessibility Features
- **Tab Navigation** - Full keyboard navigation support
- **Screen Reader Support** - Compatible with accessibility tools
- **High Contrast** - Dark mode for better visibility
- **Focus Indicators** - Clear visual focus for keyboard users

---

## Additional Resources

### Support Information
- **System Administrator** - Contact for technical issues
- **Training Materials** - Additional documentation available
- **Updates** - Application receives regular updates and improvements

### Best Practices
- **Regular Backups** - Administrators should create regular backups
- **Strong Passwords** - Use secure passwords and change them regularly
- **Data Accuracy** - Keep assignment and schedule information up to date
- **Regular Review** - Review and clean up old data periodically

### Version Information
This user guide corresponds to the current version of WorkFlow Pro. Features and interfaces may change with updates.