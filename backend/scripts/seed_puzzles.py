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
                ["S", " ", " ", "K", " ", " "],
                [" ", "W", "W", "W", "W", " "],
                [" ", " ", " ", " ", "D", " "],
                ["W", "W", "W", " ", " ", " "],
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
                "P1": {"r": 2, "c": 3},
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


async def seed_puzzles():
    """Seed the database with sample puzzles."""
    try:
        async with AsyncSessionLocal() as session:
            # Check if puzzles already exist
            statement = select(Puzzle)
            result = await session.execute(statement)
            existing_puzzles = result.scalars().all()
            
            if existing_puzzles:
                logger.info(f"Found {len(existing_puzzles)} existing puzzles. Skipping seed.")
                return
            
            # Create puzzles
            for puzzle_data in SAMPLE_PUZZLES:
                puzzle = Puzzle(**puzzle_data)
                session.add(puzzle)
                logger.info(f"Added puzzle: {puzzle.title}")
            
            await session.commit()
            logger.info(f"Successfully seeded {len(SAMPLE_PUZZLES)} puzzles!")
            
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