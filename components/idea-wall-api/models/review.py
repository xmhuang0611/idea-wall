from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .audit import AuditModel


class ReviewStatus(str, Enum):
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEED_IMPROVEMENT = "NEED_IMPROVEMENT"

class FinalDecisionType(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEED_IMPROVEMENT = "NEED_IMPROVEMENT"

class ReviewScoreItem(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str

class ReviewResult(BaseModel):
    innovation: ReviewScoreItem
    value: ReviewScoreItem
    feasibility: ReviewScoreItem
    impact: ReviewScoreItem
    return_on_investment: ReviewScoreItem
    average_score: float

class ReviewBase(BaseModel):
    idea_id: str
    target_type: str  # "Session" or "Incubator"
    reviewer_id: str
    reviewer_name: str
    review_result: ReviewResult

class ReviewCreate(BaseModel):
    review_result: ReviewResult

class ReviewInDB(ReviewBase, AuditModel):
    pass

class Review(ReviewInDB):
    id: str

class FinalDecisionBase(BaseModel):
    idea_id: str
    target_type: str  # "Session" or "Incubator"
    decision: FinalDecisionType
    comments: str

class FinalDecisionCreate(BaseModel):
    decision: FinalDecisionType
    comments: str

class FinalDecisionInDB(FinalDecisionBase, AuditModel):
    pass

class FinalDecision(FinalDecisionInDB):
    id: str 