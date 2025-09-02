"""
Script to create an admin user for managing puzzles.
"""

import asyncio
import sys
import os
import getpass

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.auth import get_password_hash
from sqlmodel import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_admin_user(email: str, password: str):
    """Create an admin user."""
    try:
        async with AsyncSessionLocal() as session:
            # Check if user already exists
            statement = select(User).where(User.email == email.strip().lower())
            result = await session.execute(statement)
            existing_user = result.scalar_one_or_none()
            if existing_user:
                logger.error(f"User with email {email} already exists!")
                return False
            
            # Create admin user
            hashed_password = get_password_hash(password)
            admin_user = User(
                email=email.strip().lower(),
                hashed_password=hashed_password,
                is_active=True
            )
            
            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)
            
            logger.info(f"Admin user created successfully with ID: {admin_user.id}")
            return True
            
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        return False


async def main():
    """Main function to create admin user."""
    logger.info("Creating admin user...")
    
    # Get email
    email = input("Enter admin email: ").strip()
    if not email:
        logger.error("Email is required!")
        return
    
    # Get password
    password = getpass.getpass("Enter admin password: ")
    if not password:
        logger.error("Password is required!")
        return
    
    # Confirm password
    confirm_password = getpass.getpass("Confirm admin password: ")
    if password != confirm_password:
        logger.error("Passwords do not match!")
        return
    
    # Initialize database if needed
    await init_db()
    
    # Create admin user
    success = await create_admin_user(email, password)
    
    if success:
        logger.info("Admin user creation completed successfully!")
    else:
        logger.error("Admin user creation failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())