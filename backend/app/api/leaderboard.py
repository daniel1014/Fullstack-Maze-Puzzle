from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_
from typing import List

from app.auth import get_current_active_user
from app.database import get_session
from app.models import User, Puzzle, Attempt
from app.schemas import LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("/", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    puzzle_id: int = Query(..., description="Puzzle ID to get leaderboard for"),
    limit: int = Query(default=10, le=50, description="Maximum number of entries"),
    success_only: bool = Query(default=True, description="Show only successful attempts"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get leaderboard for a specific puzzle.
    
    Returns top attempts ordered by:
    1. Success (successful attempts first if success_only=False)
    2. Steps taken (fewer steps = better)
    3. Time taken (faster = better)
    4. Creation time (earlier = better for ties)
    """
    # Verify puzzle exists
    puzzle = await session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puzzle not found"
        )
    
    # Build query for leaderboard
    statement = (
        select(Attempt, User.email)
        .join(User, Attempt.user_id == User.id)
        .where(Attempt.puzzle_id == puzzle_id)
    )
    
    # Filter by success if requested
    if success_only:
        statement = statement.where(Attempt.success == True)
    
    # Order by ranking criteria
    statement = statement.order_by(
        Attempt.success.desc(),  # Successful attempts first
        Attempt.steps_taken.asc(),  # Fewer steps is better
        Attempt.time_ms.asc(),  # Faster time is better
        Attempt.created_at.asc()  # Earlier submission wins ties
    ).limit(limit)
    
    result = await session.execute(statement)
    entries = result.all()
    
    # Format leaderboard entries
    leaderboard = []
    for attempt, user_email in entries:
        leaderboard.append(LeaderboardEntry(
            user_id=attempt.user_id,
            user_email=user_email,
            success=attempt.success,
            steps_taken=attempt.steps_taken,
            time_ms=attempt.time_ms,
            created_at=attempt.created_at
        ))
    
    return leaderboard


@router.get("/user/{user_id}", response_model=List[LeaderboardEntry])
async def get_user_leaderboard(
    user_id: int,
    limit: int = Query(default=10, le=50),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get a user's best attempts across all puzzles."""
    # Verify user exists (and optionally check if current user can view this data)
    target_user = await session.get(User, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # For now, users can only see their own detailed stats
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other users' detailed attempts"
        )
    
    # Get user's best attempts across all puzzles
    statement = (
        select(Attempt, User.email)
        .join(User, Attempt.user_id == User.id)
        .where(Attempt.user_id == user_id)
        .where(Attempt.success == True)  # Only successful attempts
        .order_by(
            Attempt.steps_taken.asc(),
            Attempt.time_ms.asc(),
            Attempt.created_at.asc()
        )
        .limit(limit)
    )
    
    result = await session.execute(statement)
    entries = result.all()
    
    return [
        LeaderboardEntry(
            user_id=attempt.user_id,
            user_email=user_email,
            success=attempt.success,
            steps_taken=attempt.steps_taken,
            time_ms=attempt.time_ms,
            created_at=attempt.created_at
        )
        for attempt, user_email in entries
    ]