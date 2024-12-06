import os
from datetime import datetime
from db_manager import DatabaseManager

def test_database_operations():
    # Use a test database file
    test_db = "test_backup_checker.db"
    
    # Remove test database if it exists
    if os.path.exists(test_db):
        os.remove(test_db)
    
    # Initialize database manager
    db = DatabaseManager(test_db)
    
    # Test adding and retrieving files
    print("\nTesting file operations:")
    file_id = db.add_scanned_file(
        filename="backup.tar.gz",
        filepath="/path/to/backup.tar.gz",
        last_modified=datetime.now(),
        size=1024000
    )
    print(f"Added file with ID: {file_id}")
    
    print("\nAll scanned files:")
    for file in db.get_all_scanned_files():
        print(f"ID: {file[0]}, Name: {file[1]}, Path: {file[2]}, Modified: {file[3]}, Size: {file[4]}, Scan Time: {file[5]}")
    
    # Test adding and retrieving servers
    print("\nTesting server operations:")
    server_id = db.add_server(
        hostname="test-server",
        ip_address="192.168.1.100",
        port=22,
        is_reachable=True,
        last_scan=datetime.now()
    )
    print(f"Added server with ID: {server_id}")
    
    print("\nAll servers:")
    for server in db.get_all_servers():
        print(f"ID: {server[0]}, Hostname: {server[1]}, IP: {server[2]}, Port: {server[3]}, Last Scan: {server[4]}, Reachable: {server[5]}, Scan Time: {server[6]}")

if __name__ == "__main__":
    test_database_operations()
