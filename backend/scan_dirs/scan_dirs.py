import os
import json
from datetime import datetime
import sys
from pathlib import Path

# Add the parent directory to the Python path to import the database module
sys.path.append(str(Path(__file__).parent.parent))
from database.db_manager import DatabaseManager

class DirectoryScanner:
    def __init__(self, db_manager: DatabaseManager, config_path: str):
        self.db_manager = db_manager
        self.config_path = config_path
        self.directories = self._load_config()

    def _load_config(self) -> list:
        """Load directories from config file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                return config.get('directories_to_scan', [])
        except Exception as e:
            print(f"Error loading config file: {e}")
            return []

    def scan_directories(self) -> dict:
        """
        Scan all configured directories and store file information in the database.
        Returns a dictionary of processed files by directory.
        """
        results = {}
        
        # Clear previous scan results
        self.db_manager.clear_scanned_files()
        
        for directory in self.directories:
            results[directory] = self.scan_directory(directory)
            
        return results

    def scan_directory(self, directory_path: str) -> list:
        """
        Scan a single directory recursively and store file information in the database.
        Returns a list of processed files.
        """
        processed_files = []
        
        try:
            for root, _, files in os.walk(directory_path):
                for filename in files:
                    filepath = os.path.join(root, filename)
                    try:
                        # Get file stats
                        stats = os.stat(filepath)
                        last_modified = datetime.fromtimestamp(stats.st_mtime)
                        size = stats.st_size

                        # Store in database
                        file_id = self.db_manager.add_scanned_file(
                            filename=filename,
                            filepath=filepath,
                            last_modified=last_modified,
                            size=size
                        )
                        
                        processed_files.append({
                            'id': file_id,
                            'filename': filename,
                            'filepath': filepath,
                            'last_modified': last_modified,
                            'size': size
                        })
                        
                    except OSError as e:
                        print(f"Error processing file {filepath}: {e}")
                        continue
                    
        except Exception as e:
            print(f"Error scanning directory {directory_path}: {e}")
            
        return processed_files

def main():
    # Initialize database manager
    db_manager = DatabaseManager()
    
    # Get config file path
    config_path = os.path.join(Path(__file__).parent.parent, 'config.json')
    scanner = DirectoryScanner(db_manager, config_path)
    
    # Scan all configured directories
    results = scanner.scan_directories()
    
    # Print results
    print("\nScan Results:")
    for directory, files in results.items():
        print(f"\nDirectory: {directory}")
        print(f"Found {len(files)} files:")
        for file in files:
            print(f"  - {file['filename']}")
            print(f"    Path: {file['filepath']}")
            print(f"    Size: {file['size']} bytes")
            print(f"    Last Modified: {file['last_modified']}")

if __name__ == "__main__":
    main()
