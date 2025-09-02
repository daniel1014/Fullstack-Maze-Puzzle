"""
Seed script to populate the database with sample puzzles.
Run this after setting up the database and running migrations.
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import AsyncSessionLocal, init_db
from app.models import Puzzle
from sqlmodel import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample puzzle data
SAMPLE_PUZZLES = [
    {
        "title": "Easy Start",
        "description": "A simple maze to get you started. Just reach the goal!",
        "difficulty": "easy",
        "grid": {
            "rows": 4,
            "cols": 4,
            "start": {"r": 0, "c": 0},
            "goal": {"r": 3, "c": 3},
            "cells": [
                ["S", " ", " ", " "],
                [" ", "W", " ", " "],
                [" ", "W", " ", " "],
                [" ", " ", " ", "G"]
            ],
            "portals": {},
            "rules": {
                "doors_require_keys": True,
                "max_steps": 50,
                "collect_all_keys": False
            }
        }
    },
    {
        "title": "Key and Door Challenge",
        "description": "Collect the key to unlock the door blocking your path!",
        "difficulty": "medium",
        "grid": {
            "rows": 5,
            "cols": 6,
            "start": {"r": 0, "c": 0},
            "goal": {"r": 4, "c": 5},
            "cells": [
                ["S", " ", "W", "K", " ", " "],
                ["W", "W", "W", "W", "W", " "],
                [" ", " ", " ", "D", "W", " "],
                ["W", "W", "W", " ", "W", " "],
                [" ", " ", " ", " ", " ", "G"]
            ],
            "portals": {},
            "rules": {
                "doors_require_keys": True,
                "max_steps": 100,
                "collect_all_keys": False
            }
        }
    },
    {
        "title": "Portal Maze",
        "description": "Master the portals to reach the goal efficiently!",
        "difficulty": "hard",
        "grid": {
            "rows": 6,
            "cols": 8,
            "start": {"r": 0, "c": 0},
            "goal": {"r": 5, "c": 7},
            "cells": [
                ["S", " ", "W", "K", " ", "P1", " ", " "],
                [" ", "W", " ", " ", "D", " ", " ", " "],
                [" ", " ", " ", "P2", " ", "W", " ", " "],
                [" ", "K", "W", " ", " ", " ", "D", " "],
                [" ", " ", " ", " ", "W", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " ", "G"]
            ],
            "portals": {
                "P1": {"r": 5, "c": 6},
                "P2": {"r": 0, "c": 7}
            },
            "rules": {
                "doors_require_keys": True,
                "max_steps": 200,
                "collect_all_keys": False
            }
        }
    },
    {
        "title": "Collect All Keys",
        "description": "Advanced challenge: collect ALL keys before reaching the goal!",
        "difficulty": "expert",
        "grid": {
            "rows": 6,
            "cols": 6,
            "start": {"r": 0, "c": 0},
            "goal": {"r": 5, "c": 5},
            "cells": [
                ["S", " ", "W", " ", "K", " "],
                [" ", "W", " ", " ", "W", " "],
                ["K", " ", " ", "W", " ", "K"],
                [" ", "W", " ", " ", " ", " "],
                [" ", " ", "W", " ", "W", " "],
                [" ", " ", " ", " ", " ", "G"]
            ],
            "portals": {},
            "rules": {
                "doors_require_keys": True,
                "max_steps": 150,
                "collect_all_keys": True
            }
        }
    }
]

async def upsert_puzzle(session, puzzle_data):
    """
    Upsert a puzzle into the database.
    Check if puzzle exists by title, then insert or update accordingly.
    """
    try:
        # First, check if puzzle with this title already exists
        existing_puzzle = await session.execute(
            select(Puzzle).where(Puzzle.title == puzzle_data["title"])
        )
        existing = existing_puzzle.scalar_one_or_none()
        
        if existing:
            # Update existing puzzle
            for key, value in puzzle_data.items():
                if key != "title":  # Don't update the unique identifier
                    setattr(existing, key, value)
            session.add(existing)
            logger.info(f"Updated existing puzzle: {puzzle_data['title']}")
        else:
            # Create new puzzle
            new_puzzle = Puzzle(**puzzle_data)
            session.add(new_puzzle)
            logger.info(f"Created new puzzle: {puzzle_data['title']}")
            
    except Exception as e:
        logger.error(f"Error upserting puzzle '{puzzle_data['title']}': {e}")
        raise

async def seed_puzzles():
    """Seed the database with sample puzzles using upsert logic."""
    try:
        async with AsyncSessionLocal() as session:
            for puzzle_data in SAMPLE_PUZZLES:
                await upsert_puzzle(session, puzzle_data)
            await session.commit()
            logger.info(f"Successfully upserted {len(SAMPLE_PUZZLES)} puzzles!")
    except Exception as e:
        logger.error(f"Error seeding puzzles: {e}")
        raise

async def main():
    """Main function to run the seeding."""
    logger.info("Starting puzzle seeding...")
    # Initialize database if needed
    await init_db()
    # Seed puzzles
    await seed_puzzles()
    logger.info("Puzzle seeding completed!")

if __name__ == "__main__":
    asyncio.run(main())