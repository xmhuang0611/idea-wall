from pydantic import BaseModel
from typing import Optional, TypeVar, Generic

T = TypeVar('T')

class Pagination(BaseModel):
    page: int
    page_size: int
    total: int

class ErrorDetail(BaseModel):
    code: int
    message: str

class StandardResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    pagination: Optional[Pagination] = None
    error: Optional[ErrorDetail] = None 