import sqlite3
import os
from datetime import datetime
from typing import List, Tuple, Optional, Dict
from pathlib import Path

class DatabaseManager:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Create database in the backend directory
            backend_dir = Path(__file__).parent.parent
            self.db_path = os.path.join(backend_dir, "backup_checker.db")
        else:
            self.db_path = db_path

        # Ensure the database directory exists and is writable
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Initialize the database
        self._init_db()
        
        # Set permissions to 666 (rw-rw-rw-)
        try:
            os.chmod(self.db_path, 0o666)
        except Exception as e:
            print(f"Warning: Could not set database permissions: {e}")
            print(f"You might need to manually run: chmod 666 {self.db_path}")

    def _init_db(self):
        """Initialize the database with required tables if they don't exist."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create table for scanned files
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scanned_files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    filepath TEXT NOT NULL,
                    last_modified TIMESTAMP,
                    size INTEGER,
                    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create table for scanned servers with additional nmap information
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scanned_servers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hostname TEXT NOT NULL,
                    ip_address TEXT,
                    detected_os TEXT,
                    open_ports TEXT,
                    last_scan TIMESTAMP,
                    is_reachable BOOLEAN,
                    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
                
        except sqlite3.Error as e:
            print(f"Database initialization error: {e}")
            print(f"Database path: {self.db_path}")
            print(f"Directory writable: {os.access(os.path.dirname(self.db_path), os.W_OK)}")
            print(f"File writable (if exists): {os.path.exists(self.db_path) and os.access(self.db_path, os.W_OK)}")
            raise

    def clear_scanned_files(self):
        """Remove all entries from the scanned_files table."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM scanned_files')
                conn.commit()
        except sqlite3.Error as e:
            print(f"Error clearing scanned files: {e}")
            raise

    def add_scanned_file(self, filename: str, filepath: str, last_modified: datetime, size: int) -> int:
        """Add a scanned file to the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO scanned_files (filename, filepath, last_modified, size)
                    VALUES (?, ?, ?, ?)
                ''', (filename, filepath, last_modified, size))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error adding scanned file: {e}")
            raise

    def get_all_scanned_files(self) -> List[Tuple]:
        """Retrieve all scanned files from the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM scanned_files')
                return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error retrieving scanned files: {e}")
            raise

    def update_server(self, hostname: str, data: Dict) -> int:
        """Add or update a server in the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if server exists
                cursor.execute('SELECT id FROM scanned_servers WHERE hostname = ?', (hostname,))
                result = cursor.fetchone()
                
                if result:
                    # Update existing server
                    server_id = result[0]
                    cursor.execute('''
                        UPDATE scanned_servers 
                        SET ip_address = ?,
                            detected_os = ?,
                            open_ports = ?,
                            last_scan = ?,
                            is_reachable = ?,
                            scan_time = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (
                        data.get('ip_address'),
                        data.get('detected_os'),
                        data.get('open_ports'),
                        data.get('last_scan'),
                        data.get('is_reachable'),
                        server_id
                    ))
                    return server_id
                else:
                    # Insert new server
                    cursor.execute('''
                        INSERT INTO scanned_servers (
                            hostname, ip_address, detected_os, open_ports,
                            last_scan, is_reachable
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        hostname,
                        data.get('ip_address'),
                        data.get('detected_os'),
                        data.get('open_ports'),
                        data.get('last_scan'),
                        data.get('is_reachable')
                    ))
                    return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error updating server: {e}")
            raise

    def get_all_servers(self) -> List[Tuple]:
        """Retrieve all servers from the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM scanned_servers')
                return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error retrieving servers: {e}")
            raise
