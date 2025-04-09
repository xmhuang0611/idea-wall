# API Design Document

## Overview

This document details the API design for the Idea Wall platform. The API follows RESTful principles and uses JSON for data exchange.

## 1. General Specifications

### 1.1 Base URL

- Development: `http://localhost:8000/api`
- Production: `https://idea.wall.com/api`

### 1.2 Standard Response Format

```json
{
  "status": "success|error",
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

### 1.3 HTTP Status Codes

Common HTTP status codes used in the API:

- 200: OK - Request successful
- 201: Created - Resource created successfully
- 204: No Content - Request successful, no content returned
- 400: Bad Request - Invalid request parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource conflict (e.g., duplicate slug)
- 422: Unprocessable Entity - Validation error
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server error

### 1.4 Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details if available
    }
  }
}
```

### 1.5 Authentication

- JWT-based authentication
- Token included in Authorization header: `Authorization: Bearer <token>`
- Token expiration: 24 hours
- Refresh token mechanism for extended sessions
- Token endpoints:
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout

### 1.6 Rate Limiting

- Basic rate limiting: 100 requests per minute per IP
- Authenticated users: 1000 requests per minute
- Write operations: 50 requests per minute
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## 2. API Endpoints

### User Endpoints

#### Get User Information

```http
GET /api/users/{user_id}
```

#### Create User

```http
POST /api/users
```

Request Body:

```json
{
  "user_id": "user123",
  "role": "ADMIN",
  "password": "password123"
}
```

#### Update User Information

```http
PUT /api/users/{user_id}
```

Request Body:

```json
{
  "role": "ADMIN",
  "password": "newpassword123"
}
```

### Idea Endpoints

#### Get All Ideas

```http
GET /api/ideas
```

#### Create New Idea

```http
POST /api/ideas
```

Request Body:

```json
{
  "title": "Improve User Experience",
  "description": "We should optimize the login flow...",
  "category": "Idea",
  "feeling": 8,
  "tags": [1, 2]
}
```

#### Update Idea

```http
PUT /api/ideas/{idea_id}
```

Request Body:

```json
{
  "title": "Improve User Experience",
  "description": "Updated description...",
  "category": "Idea",
  "feeling": 9,
  "tags": [1, 3]
}
```

### Comment Endpoints

#### Get Comments for an Idea

```http
GET /api/ideas/{idea_id}/comments
```

#### Add Comment

```http
POST /api/ideas/{idea_id}/comments
```

Request Body:

```json
{
  "description": "This is a great idea!",
  "parent_id": "507f1f77bcf86cd799439014"
}
```

### Vote Endpoints

#### Vote on Idea or Comment

```http
POST /api/votes
```

Request Body:

```json
{
  "vote_status": 1,
  "target_id": "507f1f77bcf86cd799439015",
  "target_type": "Idea"
}
```

### Tag Endpoints

#### Get All Tags

```http
GET /api/tags
```

#### Create New Tag

```http
POST /api/tags
```

Request Body:

```json
{
  "tag_id": 1,
  "tag": "Innovation",
  "parent_id": 0
}
```

## 3. Security Considerations

### 3.1 Authentication and Authorization

- All modification endpoints require authentication
- Role-based access control (RBAC) for sensitive operations
- Token expiration and refresh mechanism
- HTTPS required for all API calls

### 3.2 Data Validation

- Input validation on all endpoints
- Request size limits
- Content type verification
- XSS protection
- SQL injection protection

### 3.3 Security Headers

- CORS configuration
- Content Security Policy
- XSS Protection
- Rate Limiting Headers
- HSTS (HTTP Strict Transport Security)

## 4. API Documentation

- OpenAPI/Swagger documentation available at `/api/docs`
- Interactive documentation with try-it-now functionality
- Code examples in multiple languages
- Authentication examples included
