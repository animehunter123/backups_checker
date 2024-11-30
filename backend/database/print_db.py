#!/usr/bin/env python3
import os
from pathlib import Path
import sys
from datetime import datetime
from typing import List, Tuple
import sqlite3

def format_size(size_bytes: int) -> str:
    """Convert bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} PB"

def format_timestamp(timestamp) -> str:
    """Format timestamp to readable format."""
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp)
        except ValueError:
            return timestamp
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")

def print_scanned_files(cursor: sqlite3.Cursor):
    """Pretty print scanned files from database."""
    cursor.execute('SELECT * FROM scanned_files ORDER BY scan_time DESC')
    files = cursor.fetchall()
    
    if not files:
        print("\nNo scanned files found in database.")
        return
    
    print("\n=== Scanned Files ===")
    print(f"Total files: {len(files)}")
    print("=" * 80)
    
    for file in files:
        id, filename, filepath, last_modified, size, scan_time = file
        print(f"""
📄 File ID: {id}
   Name: {filename}
   Path: {filepath}
   Size: {format_size(size)}
   Last Modified: {format_timestamp(last_modified)}
   Scanned: {format_timestamp(scan_time)}
{'─' * 80}""")

def print_scanned_servers(cursor: sqlite3.Cursor):
    """Pretty print scanned servers from database."""
    cursor.execute('SELECT * FROM scanned_servers ORDER BY scan_time DESC')
    servers = cursor.fetchall()
    
    if not servers:
        print("\nNo scanned servers found in database.")
        return
    
    print("\n=== Scanned Servers ===")
    print(f"Total servers: {len(servers)}")
    print("=" * 80)
    
    for server in servers:
        id, hostname, ip, os, ports, last_scan, reachable, scan_time = server
        status_icon = "🟢" if reachable else "🔴"
        print(f"""
{status_icon} Server ID: {id}
   Hostname: {hostname}
   IP Address: {ip or 'N/A'}
   OS: {os or 'Unknown'}
   Open Ports: {ports or 'None detected'}
   Last Scan: {format_timestamp(last_scan)}
   Scan Time: {format_timestamp(scan_time)}
{'─' * 80}""")

def main():
    # Get database path
    db_path = os.path.join(Path(__file__).parent.parent, "backup_checker.db")
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        sys.exit(1)
    
    # Connect to database
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Print both tables
        print_scanned_files(cursor)
        print_scanned_servers(cursor)
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
