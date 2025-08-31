from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import Column, Integer, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field, Relationship
from pydantic import field_validator, ConfigDict


class User(SQLModel, table=True):
    """User model for authentication and puzzle attempts tracking."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")}
    )

    # Relationships
    attempts: List[Attempt] = Relationship(back_populates="user")

    model_config = ConfigDict(arbitrary_types_allowed=True)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class Puzzle(SQLModel, table=True):
    """Puzzle model storing maze configuration in JSONB format."""
    __tablename__ = "puzzles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(nullable=False)
    description: Optional[str] = None
    grid: dict[str, Any] = Field(sa_column=Column(JSONB), default_factory=dict)
    difficulty: str = Field(default="medium")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")}
    )

    # Relationships
    attempts: List[Attempt] = Relationship(back_populates="puzzle")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Attempt(SQLModel, table=True):
    """Attempt model tracking user puzzle solving attempts."""
    __tablename__ = "attempts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    )
    puzzle_id: int = Field(
        sa_column=Column(Integer, ForeignKey("puzzles.id", ondelete="CASCADE"), nullable=False)
    )
    moves: List[str] = Field(sa_column=Column(JSONB), default_factory=list)
    success: bool = Field(default=False)
    steps_taken: Optional[int] = None
    time_ms: Optional[int] = None
    keys_collected: List[str] = Field(sa_column=Column(JSONB), default_factory=list)
    trace: List[dict[str, Any]] = Field(sa_column=Column(JSONB), default_factory=list)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP AT TIME ZONE 'UTC'")}
    )

    # Relationships
    user: Optional[User] = Relationship(back_populates="attempts")
    puzzle: Optional[Puzzle] = Relationship(back_populates="attempts")

    model_config = ConfigDict(arbitrary_types_allowed=True)


# Indexes for performance
Index("ix_attempt_user", Attempt.user_id)
Index("ix_attempt_puzzle", Attempt.puzzle_id)
Index("ix_attempt_user_puzzle_created", Attempt.user_id, Attempt.puzzle_id, Attempt.created_at.desc())