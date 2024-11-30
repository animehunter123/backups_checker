#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))
from database.db_manager import DatabaseManager

def rebuild_database():
    """Rebuild the database from scratch."""
    db_path = os.path.join(Path(__file__).parent.parent, "backup_checker.db")
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Removed existing database: {db_path}")
        except Exception as e:
            print(f"Error removing existing database: {e}")
            return False
    
    try:
        # Create new database
        db_manager = DatabaseManager()
        print(f"Successfully created new database at: {db_path}")
        
        # Try to set permissions
        try:
            os.chmod(db_path, 0o666)
            print("Successfully set database permissions to 666")
        except Exception as e:
            print(f"Warning: Could not set database permissions: {e}")
            print(f"You might need to manually run: chmod 666 {db_path}")
        
        return True
    except Exception as e:
        print(f"Error creating new database: {e}")
        return False

if __name__ == "__main__":
    print("Rebuilding database...")
    if rebuild_database():
        print("Database rebuild completed successfully!")
    else:
        print("Database rebuild failed!")
