from pydantic import BaseModel, Field
from typing import List, Optional
from .audit import AuditModel
from enum import Enum
from datetime import datetime
from .review import ReviewStatus

class IdeaStatus(str, Enum):
    DRAFT = "DRAFT"
    IN_SESSION_REVIEW = "IN_SESSION_REVIEW"
    SESSION_APPROVED = "SESSION_APPROVED"
    SESSION_REJECTED = "SESSION_REJECTED"
    IN_INCUBATOR_REVIEW = "IN_INCUBATOR_REVIEW"
    INCUBATOR_APPROVED = "INCUBATOR_APPROVED"
    INCUBATOR_REJECTED = "INCUBATOR_REJECTED"
    ROLL_OUT = "ROLL_OUT"

class SessionReview(BaseModel):
    submitter_job: Optional[str] = None
    manager: Optional[str] = None
    stream: Optional[str] = None
    clients: Optional[str] = None
    problem_statements: Optional[str] = None
    solutions: Optional[str] = None
    values: Optional[str] = None
    average_score: float = 0
    status: ReviewStatus = ReviewStatus.IN_REVIEW
    review_count: int = 0
    review_comments: Optional[str] = None
    submitted_at: Optional[datetime] = None

class SessionReviewCreate(BaseModel):
    submitter_job: str
    manager: str
    stream: str
    clients: Optional[str] = None
    problem_statements: str
    solutions: str
    values: str

class LeanCanvas(BaseModel):
    problem: Optional[str] = None
    existing_alternatives: Optional[str] = None
    solution: Optional[str] = None
    key_metrics: Optional[str] = None
    unique_value: Optional[str] = None
    high_level_concept: Optional[str] = None
    unfair_advantage: Optional[str] = None
    channels: Optional[str] = None
    customer_segments: Optional[str] = None
    early_adopters: Optional[str] = None
    cost_structure: Optional[str] = None
    revenue_stream: Optional[str] = None

class LeanCanvasCreate(BaseModel):
    problem: str
    existing_alternatives: Optional[str] = None
    solution: str
    key_metrics: str
    unique_value: str
    high_level_concept: str
    unfair_advantage: Optional[str] = None
    channels: str
    customer_segments: str
    early_adopters: Optional[str] = None
    cost_structure: str
    revenue_stream: str

class IncubatorReview(BaseModel):
    lean_canvas: Optional[LeanCanvas] = None
    average_score: float = 0
    status: ReviewStatus = ReviewStatus.IN_REVIEW
    review_count: int = 0
    review_comments: Optional[str] = None
    submitted_at: Optional[datetime] = None

class IdeaTag(BaseModel):
    tag_id: int
    tag_name: str

class IdeaBase(BaseModel):
    title: str
    description: str
    feeling: int = Field(ge=1, le=5)
    tags: List[int]

class IdeaCreate(IdeaBase):
    pass

class IdeaUpdate(IdeaBase):
    pass

class IdeaInDB(IdeaBase, AuditModel):
    total_votes: int = 0
    total_comments: int = 0
    total_bookmarks: int = 0
    status: IdeaStatus = IdeaStatus.DRAFT
    session_review: Optional[SessionReview] = None
    incubator_review: Optional[IncubatorReview] = None

class Idea(IdeaInDB):
    id: str
    tag_details: Optional[List[IdeaTag]] = None
    has_voted: bool = False
    has_bookmarked: bool = False 