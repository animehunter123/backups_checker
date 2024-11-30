import sqlite3
import os
from datetime import datetime
from typing import List, Tuple, Optional, Dict

class DatabaseManager:
    def __init__(self, db_path: str = "backup_checker.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize the database with required tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
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
            
            # Create table for servers with additional nmap information
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS servers (
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

    def clear_scanned_files(self):
        """Remove all entries from the scanned_files table."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM scanned_files')
            conn.commit()

    def add_scanned_file(self, filename: str, filepath: str, last_modified: datetime, size: int) -> int:
        """Add a scanned file to the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO scanned_files (filename, filepath, last_modified, size)
                VALUES (?, ?, ?, ?)
            ''', (filename, filepath, last_modified, size))
            conn.commit()
            return cursor.lastrowid

    def get_all_scanned_files(self) -> List[Tuple]:
        """Retrieve all scanned files from the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM scanned_files')
            return cursor.fetchall()

    def update_server(self, hostname: str, data: Dict) -> int:
        """Add or update a server in the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Check if server exists
            cursor.execute('SELECT id FROM servers WHERE hostname = ?', (hostname,))
            result = cursor.fetchone()
            
            if result:
                # Update existing server
                server_id = result[0]
                cursor.execute('''
                    UPDATE servers 
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
                    INSERT INTO servers (
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

    def get_all_servers(self) -> List[Tuple]:
        """Retrieve all servers from the database."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM servers')
            return cursor.fetchall()
