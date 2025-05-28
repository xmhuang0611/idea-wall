# Database Design Document

## Overview

This document details the MongoDB collections and their schemas for the Idea Wall platform. All collections use MongoDB's default `_id` field as the primary key.

## Audit Fields

All collections include the following audit fields for tracking purposes:

| Field             | Type     | Description                   | Example Value            |
|-------------------|----------|-------------------------------|--------------------------|
| created_at        | DateTime | When the record was created   | 2024-03-20T10:30:00Z     |
| creator_id        | String   | Who created the record        | "user123"                |
| creator_name      | String   | Who created the record        | "John Doe"               |
| updated_at        | DateTime | When last updated             | 2024-03-21T15:45:00Z     |
| updater_id        | String   | Who performed the last update | "user123"                |
| updater_name      | String   | Who performed the last update | "John Doe"               |

## Collections

### Users Collection

Stores user information and their roles.

| Field         | Type     | Description                          | Example Value                        |
|---------------|----------|--------------------------------------|------------------------------------- |
| user_id       | String   | Unique user ID                       | "user123"                            |
| roles         | Array    | Array of user roles                  | ["ADMIN", "IDEA_INCUBATOR_REVIEWER"] |

### Ideas Collection

Stores all ideas and their review information.

| Field                  | Type     | Description                          | Example Value                          |
|------------------------|----------|--------------------------------------|----------------------------------------|
| title                  | String   | Idea title                           | "Improve User Experience"              |
| description            | String   | Detailed description                 | "We should optimize the login flow..." |
| feeling                | Number   | Feeling score(1-5)                   | 3                                      |
| tags                   | Array    | Array of tag IDs                     | [1,2]                                  |
| total_votes            | Number   | Total number of votes                | 42                                     |
| total_comments         | Number   | Total number of comments             | 10                                     |
| total_bookmarks        | Number   | Total number of bookmarks            | 10                                     |
| status                 | String   | Idea status                          | "IN_SESSION_REVIEW"                    |
| session_review         | Object   | Session review information object    | Session Review Object                  |
| incubator_review       | Object   | Incubator review information object  | Incubator Review Object                |

### Idea Review Collection

Stores individual review results for both sessions and incubators.

| Field                     | Type     | Description                        | Example Value                  |
|---------------------------|----------|------------------------------------|--------------------------------|
| idea_id                   | String   | Reference to the idea              | "507f1f77bcf86cd799439013"     |
| target_type               | String   | "Session" or "Incubator"           | "Session"                      |
| review_result             | Object   | Individual review result           | Review Result                  |

### Final Decision Collection

Stores final decisions made by reviewers after the minimum required reviews are received.

| Field                     | Type     | Description                        | Example Value                  |
|---------------------------|----------|------------------------------------|--------------------------------|
| idea_id                   | String   | Reference to the idea              | "507f1f77bcf86cd799439013"     |
| target_type               | String   | "Session" or "Incubator"           | "Session"                      |
| decision                  | String   | APPROVED/REJECTED/NEED_IMPROVEMENT | Decision                       |
| comments                  | String   | Decision comments                  | "This idea is ready to proceed" |

### Comments Collection

Stores comments on ideas.

| Field         | Type     | Description                    | Example Value |
|---------------|----------|--------------------------------|---------------|
| idea_id       | String   | Reference to the idea          | "507f1f77bcf86cd799439013" |
| description   | String   | Comment content                | "This is a great idea!" |
| parent_id     | String   | Parent comment for replies     | "507f1f77bcf86cd799439014" |
| votes         | Number   | Number of votes on comment     | 5                          |

### Votes Collection

Stores user votes on ideas and comments.

| Field       | Type     | Description                  | Example Value              |
|-------------|----------|------------------------------|----------------------------|
| vote_status | Number   | Vote status (0 or 1)         | 1                          |
| target_id   | String   | ID of idea/comment           | "507f1f77bcf86cd799439015" |
| target_type | String   | "Idea" or "Comment"          | "Idea"                     |

### Bookmarks Collection

Stores user's bookmark ideas.

| Field           | Type     | Description                  | Example Value              |
|-----------------|----------|------------------------------|----------------------------|
| bookmark_status | Number   | Bookmark status (0 or 1)     | 1                          |
| target_id       | String   | ID of idea/comment           | "507f1f77bcf86cd799439015" |
| target_type     | String   | "Idea" or "Comment"          | "Idea"                     |

### Tags Collection

Stores tags for categorizing ideas.

| Field       | Type   | Description                  | Example Value |
|-------------|--------|------------------------------|---------------|
| tag_id      | number | Tag id                       | 1             |
| tag_name    | String | Tag name                     | "Innovation"  |
| parent_id   | number | Parent tag for nested tags   | 0             |

### Logs

Stores operation logs for all system operations.

| Field          | Type        | Description                  | Example Value                |
|----------------|-------------|------------------------------|------------------------------|
| object_type    | String      | Operating object             | "Idea", "Comments", ...      |
| operation_type | String      | Type of operation            | "Create", "Update", "Delete" |
| object_id      | String      | Operating object id          | ObjectId or Number           |
| object_data    | String      | Operating object json        | { id: 1, tag: "Innovation" } |

### Notifications

Store notifications for all users.

| Field           | Type        | Description                  | Example Value                             |
|-----------------|-------------|------------------------------|-------------------------------------------|
| user_id         | ObjectId    | Id of receiver               | "user123"                                 |
| is_readed       | Boolean     | If notification is readed    | True                                      |
| context         | String      | Context of notification      | "New comments you have"                   |
| read_at         | DateTime    | Date time when read          | 2024-03-20T10:30:00Z                      |
| notify_status   | Object      | Status of notifaction        | {"channel": "email", "status": "success"} |

## Object Structures

### Session Review

```json
{
  "submitter_job": "...",
  "manager": "...",
  "stream": "...",
  "clients": "...",
  "problem_statements": "...",
  "solutions": "...",
  "values": "...",
  "average_score": 1,
  "status": review_status,
  "review_count": 1,
  "submitted_at": "..."
}
```

### Incubator Review

```json
{
  "lean_canvas": lean_canvas,
  "average_score": 1,
  "status": review_status,
  "review_count": 1,
  "submitted_at": "..."
}
```

### Lean Canvas

```json
{
  "problem": "...",
  "existing_alternatives": "...",
  "solution": "...",
  "key_metrics": "...",
  "unique_value": "...",
  "high_level_concept": "...",
  "unfair_advantage": "...",
  "channels": "...",
  "customer_segments": "...",
  "early_adopters": "...",
  "cost_structure": "...",
  "revenue_stream": "..."
}
```

### Review Result

```json
{
  "innovation": {
    "score": 1,
    "comment": "..."
  },
  "value": {
    "score": 1,
    "comment": "..."
  },
  "feasibility": {
    "score": 1,
    "comment": "..."
  },
  "impact": {
    "score": 1,
    "comment": "..."
  },
  "return_on_investment": {
    "score": 1,
    "comment": "..."
  },
  "average_score": 1
}
```

## Data Relationships

- Users -> Ideas: One-to-Many (users can create multiple ideas)
- Ideas -> Tags: Many-to-Many (ideas can have multiple tags, tags can belong to multiple ideas)
- Ideas -> Comments: One-to-Many (ideas can have multiple comments)
- Comments -> Comments: One-to-Many (comments can have multiple replies)
- Users -> Votes: One-to-Many (users can cast multiple votes)
- Votes -> Ideas/Comments: Many-to-One (multiple votes can reference one idea or comment)

## Enums and Constants

### User Roles

- IDEA_SESSION_PANEL_REVIEWER
- IDEA_INCUBATOR_REVIEWER
- ADMIN

### Vote Target Types

- Idea
- Comment

### Object Types

- Idea
- Comment
- Vote
- Bookmark
- Tag
- User
- Review
- FinalDecision

### Idea Statuses

- DRAFT
- IN_SESSION_REVIEW
- SESSION_APPROVED
- SESSION_REJECTED
- IN_INCUBATOR_REVIEW
- INCUBATOR_APPROVED
- INCUBATOR_REJECTED
- ROLL_OUT

### Review Status

- IN_REVIEW
- APPROVED
- REJECTED
- NEED_IMPROVEMENT

### Final Decision Types

- APPROVED
- REJECTED
- NEED_IMPROVEMENT