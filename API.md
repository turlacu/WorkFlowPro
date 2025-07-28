# WorkFlow Pro - API Documentation

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Assignment Management](#assignment-management)
- [Team Schedule Management](#team-schedule-management)
- [Shift Color Legend Management](#shift-color-legend-management)
- [Data Backup & Restore](#data-backup--restore)
- [File Upload](#file-upload)
- [Administrative](#administrative)
- [Health & Monitoring](#health--monitoring)
- [Error Responses](#error-responses)

## Authentication

### NextAuth.js Handler
**Endpoint:** `GET/POST /api/auth/[...nextauth]`
- Handles all authentication operations (login, logout, session management)
- Uses NextAuth.js framework
- Supports role-based authentication (ADMIN, PRODUCER, OPERATOR)

## User Management

### Get All Users
**Endpoint:** `GET /api/users`
- **Query Parameters:**
  - `role` (optional): Filter by user role
- **Returns:** Array of users with role information
- **Access:** All authenticated users

### Create User
**Endpoint:** `POST /api/users`
- **Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "ADMIN|PRODUCER|OPERATOR"
  }
  ```
- **Access:** Admin only
- **Validation:** Email uniqueness, password hashing

### Update User
**Endpoint:** `PUT /api/users`
- **Body:**
  ```json
  {
    "id": "string",
    "name": "string (optional)",
    "email": "string (optional)",
    "password": "string (optional)",
    "role": "ADMIN|PRODUCER|OPERATOR (optional)"
  }
  ```
- **Access:** Admin or user updating themselves
- **Note:** Users can only update their own profile (except admins)

### Delete User
**Endpoint:** `DELETE /api/users/[id]`
- **Access:** Admin only
- **Restriction:** Users cannot delete themselves

### Change Password
**Endpoint:** `POST /api/user/change-password`
- **Body:**
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Access:** Authenticated user
- **Validation:** Current password verification required

### User Statistics
**Endpoint:** `GET /api/user/statistics`
- **Query Parameters:**
  - `startDate` (optional): Start date for statistics
  - `endDate` (optional): End date for statistics
- **Returns:** Role-specific statistics
  - **Producer/Admin:** Assignments created, activity patterns, busiest periods
  - **Operator:** Assignments completed, completion patterns, productivity metrics
- **Access:** Authenticated user (own statistics)

## Assignment Management

### Get Assignments
**Endpoint:** `GET /api/assignments`
- **Query Parameters:**
  - `date` (optional): Filter by specific date
  - `search` (optional): Search in assignment titles/descriptions
- **Returns:** Array of assignments with user relationships
- **Access:** All authenticated users

### Create Assignment
**Endpoint:** `POST /api/assignments`
- **Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "dueDate": "ISO date string",
    "assignedUserId": "string",
    "priority": "LOW|MEDIUM|HIGH"
  }
  ```
- **Access:** Producer or Admin
- **Features:** Task creation with user assignment

### Update Assignment
**Endpoint:** `PUT /api/assignments`
- **Body:**
  ```json
  {
    "id": "string",
    "title": "string (optional)",
    "description": "string (optional)",
    "status": "PENDING|IN_PROGRESS|COMPLETED (optional)",
    "comment": "string (optional)",
    "priority": "LOW|MEDIUM|HIGH (optional)"
  }
  ```
- **Access:** Admin, Producer, or assigned user
- **Features:** Status updates, comments, completion tracking

### Get Single Assignment
**Endpoint:** `GET /api/assignments/[id]`
- **Returns:** Assignment with full user details
- **Access:** All authenticated users

### Delete Assignment
**Endpoint:** `DELETE /api/assignments/[id]`
- **Access:** Admin, Producer, or assignment creator

## Team Schedule Management

### Get Team Schedules
**Endpoint:** `GET /api/team-schedule`
- **Query Parameters:**
  - `date` (optional): Filter by specific date
- **Returns:** Team schedules with color legend mapping
- **Access:** All authenticated users

### Create Team Schedule
**Endpoint:** `POST /api/team-schedule`
- **Body:**
  ```json
  {
    "userId": "string",
    "date": "ISO date string",
    "shiftType": "string",
    "startTime": "string",
    "endTime": "string",
    "colorCode": "string (optional)"
  }
  ```
- **Access:** Admin or Producer
- **Features:** Bulk schedule creation with user assignment

### Upload Excel Schedule
**Endpoint:** `POST /api/team-schedule/upload-excel`
- **Body:** `multipart/form-data` with Excel file
- **Features:**
  - Supports .xls and .xlsx files
  - Complex color detection for shift mapping
  - Fuzzy name matching to existing users
  - Preview mode before import
  - Automatic color legend creation
- **Access:** Admin or Producer
- **Returns:** Import results with matching reports

### Clean Up Schedules
**Endpoint:** `DELETE /api/team-schedule/cleanup`
- **Purpose:** Clear all team schedules
- **Access:** Admin only
- **Use Case:** Prepare for new schedule imports

### Debug Team Schedules
**Endpoint:** `GET /api/team-schedule/debug`
- **Returns:** Schedule data and statistics for debugging
- **Access:** Admin only

## Shift Color Legend Management

### Get Color Legends
**Endpoint:** `GET /api/shift-color-legend`
- **Returns:** All shift color legend mappings
- **Access:** Admin only

### Create Color Legend
**Endpoint:** `POST /api/shift-color-legend`
- **Body:**
  ```json
  {
    "colorCode": "string",
    "shiftName": "string",
    "startTime": "string",
    "endTime": "string",
    "description": "string (optional)"
  }
  ```
- **Access:** Admin only
- **Purpose:** Map Excel cell colors to shift types

### Update Color Legend
**Endpoint:** `PUT /api/shift-color-legend`
- **Body:**
  ```json
  {
    "id": "string",
    "colorCode": "string (optional)",
    "shiftName": "string (optional)",
    "startTime": "string (optional)",
    "endTime": "string (optional)",
    "description": "string (optional)"
  }
  ```
- **Access:** Admin only

### Delete Color Legend
**Endpoint:** `DELETE /api/shift-color-legend/[id]`
- **Access:** Admin only

## Data Backup & Restore

### List Backups
**Endpoint:** `GET /api/backup`
- **Returns:** Array of available backup files with metadata
- **Access:** Admin only

### Create Backup
**Endpoint:** `POST /api/backup`
- **Features:** 
  - Exports users, assignments, schedules, color legends
  - Creates timestamped JSON files
- **Access:** Admin only
- **Returns:** Backup file information

### Download Backup
**Endpoint:** `GET /api/backup/[id]`
- **Returns:** Backup file download
- **Access:** Admin only

### Delete Backup
**Endpoint:** `DELETE /api/backup/[id]`
- **Access:** Admin only

### Restore from Backup
**Endpoint:** `POST /api/backup/restore`
- **Body:** `multipart/form-data` with backup file
- **Features:**
  - Preserves current admin user
  - Sets default passwords for restored users
  - Handles data conflicts gracefully
- **Access:** Admin only

## File Upload

### Upload File
**Endpoint:** `POST /api/upload`
- **Body:** `multipart/form-data`
- **Supported Types:** Excel (.xls, .xlsx), CSV
- **Size Limit:** 10MB
- **Features:**
  - File type validation
  - MinIO object storage integration
  - Security validation
- **Access:** Authenticated users

## Administrative

### Clear Database
**Endpoint:** `POST /api/admin/clear-database`
- **Body:**
  ```json
  {
    "confirmation": "CLEAR DATABASE"
  }
  ```
- **Purpose:** Complete database reset
- **Access:** Admin only
- **Result:** Creates fresh admin user (admin@workflowpro.com / admin123)
- **Security:** Requires exact confirmation text

## Health & Monitoring

### Health Check
**Endpoint:** `GET /api/health`
- **Returns:**
  ```json
  {
    "status": "healthy|unhealthy",
    "database": "connected|disconnected",
    "userCount": "number",
    "hasAdmin": "boolean",
    "environment": "string",
    "timestamp": "ISO date string"
  }
  ```
- **Purpose:** Comprehensive system health check
- **Access:** Public

### Simple Health Check
**Endpoint:** `GET /api/healthz`
- **Returns:** `{ "status": "ok" }`
- **Purpose:** Basic health check for deployment monitoring
- **Access:** Public

### Status Check
**Endpoint:** `GET /api/status`
- **Returns:** Environment and configuration status
- **Access:** Public

### Debug Information
**Endpoint:** `GET /api/debug`
- **Returns:** Debug information for troubleshooting
- **Features:**
  - Database connectivity test
  - Admin password validation
  - Environment diagnostics
- **Access:** Admin only

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE (optional)",
  "details": "Additional details (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Codes
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `USER_NOT_FOUND` - Requested user doesn't exist
- `ASSIGNMENT_NOT_FOUND` - Requested assignment doesn't exist
- `DUPLICATE_EMAIL` - Email already exists
- `INVALID_CREDENTIALS` - Login credentials incorrect
- `FILE_TOO_LARGE` - Uploaded file exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file format

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production deployments.

## Authentication Headers

All authenticated endpoints require a valid session cookie set by NextAuth.js. No additional headers are required.

## CORS Policy

CORS is handled by Next.js default configuration. Modify `next.config.ts` if custom CORS policies are needed.