from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import Column, Integer, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import SQLModel, Field
from sqlalchemy.orm import relationship
from pydantic import field_validator, ConfigDict


class User(SQLModel, table=True):
    """User model for authentication and puzzle attempts tracking."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("timezone('utc', now())")}
    )

    # Relationships (註釋為避免 SQLModel 型別解析錯誤)
    # attempts: list = relationship("Attempt", back_populates="user", cascade="all, delete-orphan")

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
    grid: Any = Field(sa_column=Column(JSONB), default_factory=dict)
    difficulty: str = Field(default="medium")
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("timezone('utc', now())")}
    )

    # Relationships (註釋為避免 SQLModel 型別解析錯誤)
    # attempts: list = relationship("Attempt", back_populates="puzzle", cascade="all, delete-orphan")

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
    moves: Any = Field(sa_column=Column(JSONB), default_factory=list)
    success: bool = Field(default=False)
    steps_taken: Optional[int] = None
    time_ms: Optional[int] = None
    keys_collected: Any = Field(sa_column=Column(JSONB), default_factory=list)
    trace: Any = Field(sa_column=Column(JSONB), default_factory=list)
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"server_default": text("timezone('utc', now())")}
    )

    # Relationships (註釋為避免 SQLModel 型別解析錯誤)
    # user: Optional["User"] = relationship("User", back_populates="attempts")
    # puzzle: Optional["Puzzle"] = relationship("Puzzle", back_populates="attempts")

    model_config = ConfigDict(arbitrary_types_allowed=True)


# Indexes for performance
Index("ix_attempt_user", Attempt.user_id)
Index("ix_attempt_puzzle", Attempt.puzzle_id)
Index("ix_attempt_user_puzzle_created", Attempt.user_id, Attempt.puzzle_id, Attempt.created_at.desc())