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

Stores all ideas submitted to the platform.

| Field          | Type     | Description                          | Example Value                          |
|----------------|----------|--------------------------------------|----------------------------------------|
| title          | String   | Idea title                           | "Improve User Experience"              |
| description    | String   | Detailed description                 | "We should optimize the login flow..." |
| feeling        | Number   | Feeling score                        | 8                                      |
| tags           | Array    | Array of tag IDs                     | [1,2]                                  |
| total_votes    | Number   | Total number of votes                | 42                                     |
| total_comments | Number   | Total number of comments             | 10                                     |

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
| notification_id | ObjectId    | Id of notification           | "234d234g234g34524g234233"                |
| user_id         | ObjectId    | Id of receiver               | "user123"                                 |
| is_readed       | Boolean     | If notification is readed    | True                                      |
| context         | String      | Context of notification      | "New comments you have"                   |
| read_at         | DateTime    | Date time when read          | 2024-03-20T10:30:00Z                      |
| notify_status   | Object      | Status of notifaction        | {"channel": "email", "status": "success"} |

## Indexes

### Users Collection

- `user_id`: Unique index
- `roles`: Index for role-based queries

### Ideas Collection

- `tags`: Index for tag-based queries
- `creator_id`: Index for user's ideas
- `total_votes`: Index for sorting

### Comments Collection

- `idea_id`: Index for idea-based queries
- `parent_id`: Index for comment threading
- Compound index: `[idea_id, created_at]` for sorted comments

### Votes Collection

- `target_id`: Index for vote counts
- Compound index: `[target_id, target_type, creator_id]`

### Bookmarks Collection

- `idea_id`: Index for bookmark counts
- Compound index: `[idea_id, creator_id]`

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

- IDEA_SESSION_PANEL_REVIEWER
- IDEA_INCUBATOR_REVIEWER
- ADMIN

## User Info

### UserInfo Collection 

| Field               | Type        | Description                                         | Example                          |
|---------------------|-------------|-----------------------------------------------------|-----------------------------------|
| user_id             | String      | Unique user identifier                              | "u123456"                        |
| nickname            | String      | User's display name                                 | "Alice"                          |
| avatar_url          | String      | URL of user's avatar                                | "https://..."                    |
| email               | String      | User's email address                                | "alice@example.com"              |
| bio                 | String      | User's personal introduction or bio                 | "Product manager, Innovator"     |
| role                | String      | User role (e.g., USER, IDEA_SESSION_PANNEL_REVIEWER, IDEA_INCUBATOR_REVIEWER, ADMIN) | "USER" |
| point_rank          | Number      | User's rank in the points leaderboard               | 8                                |
| notification_prefs  | Object      | Notification preferences (channels, frequency, etc) | { "email": true, "in_app": true } |
| privacy_settings    | Object      | Privacy settings for profile and notifications      | { "show_email": false }           |

#### Notes

- To get the total number of ideas or pain points for a user, aggregate queries can be performed on the Ideas Collection using `user_id`.
- The `role` field indicates the user's role in the system, such as USER, IDEA_SESSION_PANNEL_REVIEWER, IDEA_INCUBATOR_REVIEWER, or ADMIN.


#### Indexes

- `user_id`: Unique index

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
