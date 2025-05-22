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

Stores all ideas submitted to the platform. This is the base entity that has one-to-one relationships with Idea Session and Idea Incubator.

| Field           | Type     | Description                          | Example Value                          |
|-----------------|----------|--------------------------------------|----------------------------------------|
| title           | String   | Idea title                           | "Improve User Experience"              |
| description     | String   | Detailed description                 | "We should optimize the login flow..." |
| feeling         | Number   | Feeling score(1-5)                   | 3                                      |
| tags            | Array    | Array of tag IDs                     | [1,2]                                  |
| total_votes     | Number   | Total number of votes                | 42                                     |
| total_comments  | Number   | Total number of comments             | 10                                     |
| total_bookmarks | Number   | Total number of bookmarks            | 10                                     |
| current_status  | String   | Current overall status of the idea   | "IN_SESSION_REVIEW"                    |
| current_session_id | String | Reference to current session        | "507f1f77bcf86cd799439013"             |
| current_incubator_id | String | Reference to current incubator    | "507f1f77bcf86cd799439014"             |

### Idea Sessions Collection

Stores idea session data. Each idea has exactly one session, but the session has its own version history.

| Field              | Type     | Description                    | Example Value                  |
|--------------------|----------|--------------------------------|--------------------------------|
| idea_id            | String   | Reference to the idea          | "507f1f77bcf86cd799439013"     |
| session_version    | Number   | Version of this session        | 2                              |
| basic_info         | Object   | basic info                     | Basic Info                     |
| problem_statements | String   | problem description            | "..."                          |
| solutions          | String   | solution description           | "..."                          |
| values             | String   | value description              | "..."                          |
| score              | Number   | score                          | 1                              |
| status             | String   | status                         | Idea Review Status             |
| review_count       | Number   | Number of reviews received     | 3                              |
| previous_session_id | String  | ID of the previous session version | "507f1f77bcf86cd799439012" |
| has_final_decision | Boolean  | Whether final decision is made | false                      |
| final_reviewer_id  | String   | ID of reviewer who made final decision | "user456"              |
| final_reviewer_name| String   | Name of reviewer who made final decision | "Jane Smith"          |
| final_decision     | String   | Final decision (APPROVED/REJECTED/NEED_IMPROVEMENT) | "APPROVED" |
| final_comments     | String   | Final decision comments        | "This idea needs clarification on..." |
| is_current         | Boolean  | Whether this is the current version | true                      |

### Idea Incubators Collection

Stores idea incubator data. Each idea has exactly one incubator if it passed the session review, and the incubator has its own version history.

| Field         | Type     | Description                    | Example Value                  |
|---------------|----------|--------------------------------|--------------------------------|
| idea_id       | String   | Reference to the idea          | "507f1f77bcf86cd799439013"     |
| incubator_version | Number | Version of this incubator    | 1                              |
| basic_info    | Object   | basic info                     | Basic Info                     |
| lean_canvas   | Object   | Lean canvas data               | Lean Canvas                    |
| score         | Number   | score                          | 1                              |
| status        | String   | status                         | Idea Review Status             |
| review_count  | Number   | Number of reviews received     | 2                              |
| previous_incubator_id | String | ID of the previous incubator version | "507f1f77bcf86cd799439015" |
| has_final_decision | Boolean  | Whether final decision is made | false                      |
| final_reviewer_id  | String   | ID of reviewer who made final decision | "user456"              |
| final_reviewer_name| String   | Name of reviewer who made final decision | "Jane Smith"          |
| final_decision     | String   | Final decision (APPROVED/REJECTED/NEED_IMPROVEMENT) | "APPROVED" |
| final_comments     | String   | Final decision comments        | "This idea needs clarification on..." |
| is_current    | Boolean  | Whether this is the current version | true                      |

### Idea Review Collection

Stores individual review results for both sessions and incubators. Multiple reviewers can submit their reviews independently.

| Field                     | Type     | Description                        | Example Value                  |
|---------------------------|----------|------------------------------------|--------------------------------|
| idea_id                   | String   | Reference to the idea              | "507f1f77bcf86cd799439013"     |
| target_id                 | String   | Reference to the session/incubator | "507f1f77bcf86cd799439013"     |
| target_type               | String   | "Session" or "Incubator"           | "Incubator"                    |
| target_version            | Number   | Version of the target              | 2                              |
| reviewer_id               | String   | reviewer id                        | "user123"                      |
| reviewer_name             | String   | reviewer name                      | "John Doe"                     |
| review_result             | Object   | Individual review result           | Review Result                  |

### Final Decision Collection

Stores final decisions made by reviewers after the minimum required reviews are received.

| Field                     | Type     | Description                        | Example Value                  |
|---------------------------|----------|------------------------------------|--------------------------------|
| idea_id                   | String   | Reference to the idea              | "507f1f77bcf86cd799439013"     |
| target_id                 | String   | Reference to the session/incubator | "507f1f77bcf86cd799439013"     |
| target_type               | String   | "Session" or "Incubator"           | "Incubator"                    |
| target_version            | Number   | Version of the target              | 2                              |
| decision_maker_id         | String   | ID of user who made final decision | "user456"                      |
| decision_maker_name       | String   | Name of user who made decision     | "Jane Smith"                   |
| decision                  | String   | APPROVED/REJECTED/NEED_IMPROVEMENT | "APPROVED"                     |
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

## Indexes

### Users Collection

- `user_id`: Unique index
- `roles`: Index for role-based queries

### Ideas Collection

- `tags`: Index for tag-based queries
- `creator_id`: Index for user's ideas
- `total_votes`: Index for sorting
- `current_status`: Index for status-based queries
- `current_session_id`: Index for session relationship
- `current_incubator_id`: Index for incubator relationship

### Idea Sessions Collection

- `idea_id`: Unique index for one-to-one relationship with Idea
- `status`: Index for status-based queries
- `session_version`: Index for version-based queries
- `previous_session_id`: Index for tracking version lineage
- `is_current`: Index for finding current version
- `review_count`: Index for filtering based on review count
- `has_final_decision`: Index for finding sessions pending final decision

### Idea Incubators Collection

- `idea_id`: Unique index for one-to-one relationship with Idea
- `status`: Index for status-based queries
- `incubator_version`: Index for version-based queries
- `previous_incubator_id`: Index for tracking version lineage
- `is_current`: Index for finding current version
- `review_count`: Index for filtering based on review count
- `has_final_decision`: Index for finding incubators pending final decision

### Idea Review Collection

- `target_id`: Index for review target lookup
- Compound index: `[target_id, target_type, target_version]` for specific version reviews
- `reviewer_id`: Index for reviewer-based queries
- `created_at`: Index for time-based queries

### Final Decision Collection

- `target_id`: Index for decision target lookup
- Compound index: `[target_id, target_type, target_version]` for specific version decisions
- `decision_maker_id`: Index for decision maker queries
- `created_at`: Index for time-based queries

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
- Ideas -> Idea Sessions: One-to-One (an idea has exactly one session)
- Ideas -> Idea Incubators: One-to-One (an idea has exactly one incubator if it passed session review)
- Idea Sessions -> Idea Sessions: One-to-One (version lineage through previous_session_id)
- Idea Incubators -> Idea Incubators: One-to-One (version lineage through previous_incubator_id)
- Sessions/Incubators -> Reviews: One-to-Many (a session/incubator can have multiple reviews)
- Sessions/Incubators -> Final Decision: One-to-One (a session/incubator has exactly one final decision after review)

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
- IdeaSession
- IdeaIncubator
- Review
- FinalDecision

### Idea Statuses (for Ideas Collection)

- PUBLISHED
- IN_SESSION_REVIEW
- SESSION_APPROVED
- SESSION_REJECTED
- IN_INCUBATION_REVIEW
- INCUBATION_APPROVED
- INCUBATION_REJECTED
- ROLL_OUT

### Session & Incubator Review Status

- PENDING
- IN_REVIEW
- APPROVED
- REJECTED
- NEED_IMPROVEMENT
- RESUBMITTED

### Final Decision Types

- APPROVED
- REJECTED
- NEED_IMPROVEMENT

### Basic Info

{
    "idea_title": "...",
    "submitter_id": "...",
    "submitter_name": "...",
    "submitter_job": "...",
    "manager": "...",
    "stream": "...",
    "clients": "..."
}

### Lean Canvas

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

### Review Result

{
    innovation:{
        score: 1,
        comment: "..."
    },
    value:{
        score: 1,
        comment: "..."
    },
    feasibility:{
        score: 1,
        comment: "..."
    },
    impact:{
        score: 1,
        comment: "..."
    },
    return_on_investment:{
        score: 1,
        comment: "..."
    },
    average_score: 1
}