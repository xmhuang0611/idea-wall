# Database Design Document

## Overview

This document details the MongoDB collections and their schemas for the Idea Wall platform. All collections use MongoDB's default `_id` field as the primary key.

## Audit Fields

All collections include the following audit fields for tracking purposes:

| Field      | Type     | Description                   | Example Value |
| ---------- | -------- | ----------------------------- | ------------- |
| created_at | DateTime | When the record was created   | 2024-03-20T10:30:00Z |
| created_by | ObjectId | Who created the record        | 507f1f77bcf86cd799439011 |
| updated_at | DateTime | When last updated             | 2024-03-21T15:45:00Z |
| updated_by | ObjectId | Who performed the last update | 507f1f77bcf86cd799439012 |

## Collections

### Users Collection

Stores user information and their roles.

| Field         | Type     | Description                          | Example Value |
|---------------|----------|--------------------------------------|---------------|
| user_id       | String   | Unique user ID                       | "user123" |
| role          | String   | User's role in the system            | "ADMIN" |
| password      | String   | User's password                      | "password123" |

### Ideas Collection

Stores all ideas submitted to the platform.

| Field          | Type     | Description                           | Example Value |
|----------------|----------|---------------------------------------|---------------|
| title          | String   | Idea title                            | "Improve User Experience" |
| description    | String   | Detailed description                  | "We should optimize the login flow..." |
| category       | String   | Idea category                        | "Idea" |
| feeling        | Number   | Feeling score                        | 8 |
| tags           | Array    | Array of tag IDs                     | [1,2] |
| total_votes    | Number   | Total number of votes                | 42 |

### Comments Collection

Stores comments on ideas.

| Field    | Type     | Description                    | Example Value |
|----------|----------|--------------------------------|---------------|
| idea_id  | ObjectId | Reference to the idea          | "507f1f77bcf86cd799439013" |
| description   | String   | Comment content                | "This is a great idea!" |
| parent_id| ObjectId | Parent comment for replies     | "507f1f77bcf86cd799439014" |
| votes    | Number   | Number of votes on comment     | 5 |

### Votes Collection

Stores user votes on ideas and comments.

| Field       | Type     | Description                  | Example Value |
|-------------|----------|------------------------------|---------------|
| vote_status | Number   | Vote status (0 or 1)         | 1 |
| target_id   | ObjectId | ID of idea/comment          | "507f1f77bcf86cd799439015" |
| target_type | String   | "Idea" or "Comment"         | "Idea" |

### Tags Collection

Stores tags for categorizing ideas.

| Field       | Type   | Description                  | Example Value |
|-------------|--------|------------------------------|---------------|
| tag_id     | number | Tag id                     | 1 |
| tag       | String | Tag name                     | "Innovation" |
| parent_id | number | Parent tag for nested tags   | 0 |

## Indexes

### Users Collection

- `user_id`: Unique index
- `role`: Index for role-based queries

### Ideas Collection

- `category`: Index for category-based queries
- `tags`: Index for tag-based queries
- `created_by`: Index for user's ideas
- `total_votes`: Index for sorting
- Compound index: `[category, total_votes]` for filtered searches and sorting

### Comments Collection

- `idea_id`: Index for idea-based queries
- `parent_id`: Index for comment threading
- Compound index: `[idea_id, created_at]` for sorted comments

### Votes Collection

- Compound unique index: `[target_id, target_type, created_by]`
- `target_id`: Index for vote counts

### Tags Collection

- `tag`: Unique index
- `parent_id`: Index for hierarchical tag queries

## Data Relationships

- Users -> Ideas: One-to-Many (users can create multiple ideas)
- Ideas -> Tags: Many-to-Many (ideas can have multiple tags, tags can belong to multiple ideas)
- Ideas -> Comments: One-to-Many (ideas can have multiple comments)
- Comments -> Comments: One-to-Many (comments can have multiple replies)
- Users -> Votes: One-to-Many (users can cast multiple votes)
- Votes -> Ideas/Comments: Many-to-One (multiple votes can reference one idea or comment)

## Enums and Constants

### User Roles

- IDEA_SESSION_PANNEL_REVIEWER
- IDEA_INCUBATOR_REVIEWER
- ADMIN

### Idea Categories

- Idea
- Pain
- Thought

### Vote Target Types

- Idea
- Comment
