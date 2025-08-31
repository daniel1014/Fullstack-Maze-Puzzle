from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    """Schema for user registration."""
    email: str
    password: str


class UserRead(BaseModel):
    """Schema for user data responses (excludes sensitive fields)."""
    id: int
    email: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


# JWT Token Schemas
class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT token payload data."""
    sub: Optional[str] = None


# Puzzle Schemas
class PuzzleBase(BaseModel):
    """Base puzzle schema."""
    title: str
    description: Optional[str] = None
    difficulty: str = "medium"


class PuzzleCreate(PuzzleBase):
    """Schema for creating a new puzzle."""
    grid: Dict[str, Any]


class PuzzleRead(PuzzleBase):
    """Schema for puzzle list responses (without full grid)."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PuzzleDetail(PuzzleRead):
    """Schema for detailed puzzle responses (with full grid)."""
    grid: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


# Attempt Schemas
class AttemptCreate(BaseModel):
    """Schema for submitting a puzzle attempt."""
    moves: List[str]
    client_time_ms: Optional[int] = None


class AttemptResponse(BaseModel):
    """Schema for attempt validation response."""
    success: bool
    message: str
    steps: int
    keys_collected: List[str]
    trace: List[Dict[str, Any]]


class AttemptRead(BaseModel):
    """Schema for attempt history responses."""
    id: int
    user_id: int
    puzzle_id: int
    success: bool
    steps_taken: Optional[int]
    time_ms: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entries."""
    user_id: int
    user_email: str
    success: bool
    steps_taken: Optional[int]
    time_ms: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)