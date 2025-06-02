from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from .audit import AuditModel

class SystemConfigBase(BaseModel):
    """
    Base model for system configuration
    """
    key: str = Field(..., min_length=1, max_length=100, description="Unique key for the configuration")
    description: str = Field(..., min_length=1, max_length=500, description="Description of the configuration")
    value: str = Field(..., min_length=1, max_length=1000, description="Value of the configuration")

    @validator('key')
    def validate_key(cls, v):
        """
        Validate key format: only letters, numbers, dots, underscores and hyphens are allowed
        """
        import re
        if not re.match(r'^[a-zA-Z0-9._-]+$', v):
            raise ValueError('Key can only contain letters, numbers, dots, underscores and hyphens')
        return v

class SystemConfigCreate(SystemConfigBase):
    """
    Model for creating a new system configuration
    """
    pass

class SystemConfigUpdate(BaseModel):
    """
    Model for updating a system configuration
    """
    value: str = Field(..., min_length=1, max_length=1000, description="New value for the configuration")

class SystemConfigInDB(SystemConfigBase, AuditModel):
    """
    Model for system configuration as stored in database
    """
    pass

class SystemConfig(SystemConfigInDB):
    """
    Complete system configuration model
    """
    class Config:
        from_attributes = True 