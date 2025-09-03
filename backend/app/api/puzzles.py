from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional

from app.auth import get_current_active_user
from app.database import get_session
from app.models import User, Puzzle, Attempt
from app.schemas import (
    PuzzleRead, 
    PuzzleDetail, 
    AttemptCreate, 
    AttemptResponse, 
    AttemptRead,
    LeaderboardEntry
)
from app.puzzle_engine import validate_moves, PuzzleValidationError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/puzzles", tags=["puzzles"])


@router.get("/", response_model=List[PuzzleRead])
async def get_puzzles(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of all available puzzles."""
    statement = select(Puzzle).order_by(Puzzle.difficulty, Puzzle.created_at)
    result = await session.execute(statement)
    puzzles = result.scalars().all()
    
    return [PuzzleRead.model_validate(puzzle) for puzzle in puzzles]


@router.get("/{puzzle_id}", response_model=PuzzleDetail)
async def get_puzzle(
    puzzle_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed puzzle information including the grid."""
    puzzle = await session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puzzle not found"
        )
    
    return PuzzleDetail.model_validate(puzzle)


@router.post("/{puzzle_id}/attempts", response_model=AttemptResponse)
async def submit_attempt(
    puzzle_id: int,
    attempt_data: AttemptCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Submit a puzzle attempt and get validation result."""
    # Get puzzle
    puzzle = await session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puzzle not found"
        )
    
    try:
        # Validate moves using puzzle engine
        result = validate_moves(puzzle.grid, attempt_data.moves)
        
        # Create attempt record
        attempt = Attempt(
            user_id=current_user.id,
            puzzle_id=puzzle_id,
            moves=attempt_data.moves,
            success=result["success"],
            steps_taken=result["steps"],
            time_ms=attempt_data.client_time_ms,
            keys_collected=result["keys_collected"],
            trace=result["trace"]
        )
        
        session.add(attempt)
        await session.commit()
        await session.refresh(attempt)
        
        logger.info(
            f"User {current_user.id} attempt on puzzle {puzzle_id}: "
            f"{'SUCCESS' if result['success'] else 'FAILED'} in {result['steps']} steps"
        )
        
        return AttemptResponse(
            success=result["success"],
            message=result["message"],
            steps=result["steps"],
            keys_collected=result["keys_collected"],
            trace=result["trace"],
            time_ms=attempt_data.client_time_ms
        )
        
    except PuzzleValidationError as e:
        # Log validation error but don't save attempt
        logger.warning(f"Puzzle validation error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid moves: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error processing attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process attempt"
        )


@router.get("/{puzzle_id}/attempts", response_model=List[AttemptRead])
async def get_puzzle_attempts(
    puzzle_id: int,
    limit: int = Query(default=10, le=50),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get user's attempts for a specific puzzle."""
    # Verify puzzle exists
    puzzle = await session.get(Puzzle, puzzle_id)
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puzzle not found"
        )
    
    # Get user's attempts for this puzzle
    statement = (
        select(Attempt)
        .where(Attempt.user_id == current_user.id)
        .where(Attempt.puzzle_id == puzzle_id)
        .order_by(Attempt.created_at.desc())
        .limit(limit)
    )
    
    result = await session.execute(statement)
    attempts = result.scalars().all()
    
    return [AttemptRead.model_validate(attempt) for attempt in attempts]