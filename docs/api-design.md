# API Design Document

## Overview

This document details the API design for the Idea Wall platform. The API follows RESTful principles and uses JSON for data exchange.

## 1. General Specifications

### 1.1 Base URL

- Development: `http://localhost:8000/api`
- Production: `https://idea.wall.com/api`

### 1.2 HTTP Status Codes

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

```python
status_code = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500
```

### 1.3 Standard Response Format

```json
{
  "success": true|false,
  "data": {
    // Response data
  },
  // optional, only for list response
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100
  },
  // optional, only for error response
  "error": {
    "status_code": status_code,
    "message": "Error message"
  }
}
```

### 1.4 Authentication

- JWT-based authentication
- Token included in Authorization header: `Authorization: Bearer <token>`
- Token expiration: 24 hours
- Refresh token mechanism for extended sessions
- Token endpoints:
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout

### 1.5 Rate Limiting

- Basic rate limiting: 100 requests per minute per IP
- Authenticated users: 1000 requests per minute
- Write operations: 50 requests per minute
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## 2. API Endpoints

### User Endpoints

#### Get User Information and Roles

```http
GET /api/users/{user_id}
```

#### Get All Users with Roles

```http
GET /api/users/with-roles
```

Query Parameters:

```
page=1
page_size=20
role=ADMIN  // optional, filter by role
```

Response Body:

```json
{
  "success": true,
  "data": [
    {
      "user_id": "user123",
      "roles": ["ADMIN", "IDEA_INCUBATOR_REVIEWER"],
    },
    // more users...
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}
```

#### Add User Roles

```http
POST /api/users/{user_id}/roles
```

Request Body:

```json
{
  "roles": ["ADMIN", "IDEA_INCUBATOR_REVIEWER"]
}
```

#### Update User Roles

```http
PUT /api/users/{user_id}/roles
```

Request Body:

```json
{
  "roles": ["ADMIN", "IDEA_INCUBATOR_REVIEWER"]
}
```

#### Delete User Roles

```http
DELETE /api/users/{user_id}/roles
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

### Log Endpoints

#### Get All Logs

```http
GET /api/logs
```

Query Parameters:

```
page=1
page_size=20
object=Idea  // optional, filter by object type
object_id=507f1f77bcf86cd799439015  // optional, filter by object id
start_date=2023-01-01  // optional, filter by date range
end_date=2023-12-31  // optional, filter by date range
```

Response Body:

```json
{
  "success": true,
  "data": [
    {
      "log_id": "507f1f77bcf86cd799439013",
      "object": "Idea",
      "object_id": "507f1f77bcf86cd799439015",
      "object_data": "{\"id\":\"507f1f77bcf86cd799439015\",\"title\":\"Improve User Experience\"}",
    },
    // more logs...
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}
```

#### Get Log by ID

```http
GET /api/logs/{log_id}
```

Response Body:

```json
{
  "success": true,
  "data": {
    "log_id": "507f1f77bcf86cd799439013",
    "object": "Idea",
    "object_id": "507f1f77bcf86cd799439015",
    "object_data": "{\"id\":\"507f1f77bcf86cd799439015\",\"title\":\"Improve User Experience\"}",
  }
}
```

#### Create Log

```http
POST /api/logs
```

Request Body:

```json
{
  "object": "Idea",
  "object_id": "507f1f77bcf86cd799439015",
  "object_data": "{\"id\":\"507f1f77bcf86cd799439015\",\"title\":\"Improve User Experience\"}",
}
```

Response:

```json
{
  "success": true,
  "data": {
    "log_id": "507f1f77bcf86cd799439013"
  }
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
