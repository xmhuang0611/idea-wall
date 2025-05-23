from enum import Enum
from pydantic import BaseModel, Field
from .audit import AuditModel

class TargetType(str, Enum):
    SESSION = "Session"
    INCUBATOR = "Incubator"

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
    target_type: TargetType
    review_result: ReviewResult

class ReviewCreate(BaseModel):
    review_result: ReviewResult

class ReviewInDB(ReviewBase, AuditModel):
    pass

class Review(ReviewInDB):
    id: str

class FinalDecisionBase(BaseModel):
    idea_id: str
    target_type: TargetType
    decision: FinalDecisionType
    comments: str

class FinalDecisionCreate(BaseModel):
    decision: FinalDecisionType
    comments: str

class FinalDecisionInDB(FinalDecisionBase, AuditModel):
    pass

class FinalDecision(FinalDecisionInDB):
    id: str 