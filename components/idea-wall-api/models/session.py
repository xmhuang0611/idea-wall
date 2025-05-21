from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .audit import AuditModel
from enum import Enum
from .review import ReviewStatus, FinalDecisionType

class BasicInfo(BaseModel):
    idea_title: str
    submitter_id: str
    submitter_name: str
    submitter_job: Optional[str] = None
    manager: Optional[str] = None
    stream: Optional[str] = None
    clients: Optional[str] = None

class SessionBase(BaseModel):
    idea_id: str
    session_version: int = 1
    basic_info: BasicInfo
    problem_statements: str
    solutions: str
    value: str
    score: Optional[float] = None
    status: ReviewStatus = ReviewStatus.PENDING
    review_count: int = 0
    previous_session_id: Optional[str] = None
    has_final_decision: bool = False
    final_reviewer_id: Optional[str] = None
    final_reviewer_name: Optional[str] = None
    final_decision: Optional[FinalDecisionType] = None
    final_comments: Optional[str] = None
    is_current: bool = True

class SessionCreate(BaseModel):
    idea_id: str
    basic_info: BasicInfo
    problem_statements: str
    solutions: str
    value: str

class SessionUpdate(BaseModel):
    problem_statements: Optional[str] = None
    solutions: Optional[str] = None
    value: Optional[str] = None

class SessionInDB(SessionBase, AuditModel):
    pass

class Session(SessionInDB):
    id: str 