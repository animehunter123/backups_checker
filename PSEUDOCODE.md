# Backup Checker Application - Detailed Pseudocode Documentation

## Overview
The Backup Checker is a web application that monitors server backups by:
1. Scanning network for available servers using nmap
2. Scanning specified directories for backup files
3. Matching backup files to servers based on hostname/IP
4. Displaying backup status in a web interface

## Backend Architecture

### 1. Database Layer (`backend/database/db_manager.py`)
```python
class DatabaseManager:
    # Initialize SQLite database with two tables:
    # 1. scanned_files: Store backup file information
    #    - id, filename, filepath, last_modified, size, scan_time
    # 2. scanned_servers: Store discovered server information
    #    - id, hostname, ip_address, detected_os, open_ports, last_scan, is_reachable, scan_time
    
    def add_scanned_file(filename, filepath, last_modified, size):
        # Insert or update file record in database
        # Return file_id
    
    def add_scanned_server(hostname, ip, os, ports):
        # Insert or update server record in database
        # Return server_id
    
    def get_all_scanned_files():
        # Return all files from database
    
    def get_all_servers():
        # Return all servers from database
    
    def clear_scanned_files():
        # Delete all file records
    
    def clear_scanned_servers():
        # Delete all server records
```

### 2. Directory Scanner (`backend/scan_dirs/scan_dirs.py`)
```python
class DirectoryScanner:
    def scan_directories():
        # 1. Load directories from config.json
        # 2. For each configured directory:
        #    - Walk through directory recursively
        #    - For each file found:
        #      * Get file metadata (name, path, modified time, size)
        #      * Store in database via DatabaseManager
        # 3. Return list of all found files
```

### 3. Server Scanner (`backend/scan_servers/scan_servers.py`)
```python
class SubnetScanner:
    def scan_subnets():
        # 1. Load subnets from config.json
        # 2. For each subnet:
        #    - Use nmap to scan network
        #    - For each host found:
        #      * Get hostname, IP, OS, open ports
        #      * Store in database via DatabaseManager
        # 3. Return list of all found servers
```

### 4. Main Backend API (`backend/app.py`)
```python
# Flask REST API endpoints:

@app.route('/api/files', methods=['GET'])
def get_files():
    # 1. Get all files from database
    # 2. Format timestamps and metadata
    # 3. Return JSON response

@app.route('/api/servers', methods=['GET'])
def get_servers():
    # 1. Get all servers from database
    # 2. Get all files from database
    # 3. For each server:
    #    - Find matching backup files (by hostname/IP)
    #    - Determine backup status:
    #      * GREEN = backup < 1 year old
    #      * YELLOW = backup exists but > 1 year old
    #      * RED = no backup found
    # 4. Return JSON response

@app.route('/api/scan/directories', methods=['POST'])
def scan_directories():
    # 1. Create DirectoryScanner
    # 2. Run scan
    # 3. Return success/failure response

@app.route('/api/scan/servers', methods=['POST'])
def scan_servers():
    # 1. Create SubnetScanner
    # 2. Run scan
    # 3. Return success/failure response

@app.route('/api/config', methods=['GET', 'PUT'])
def handle_config():
    # GET: Return current config
    # PUT: Update config with new values
```

## Frontend Architecture

### 1. Main Components

#### BackupStatus Page (`frontend/src/pages/BackupStatus.jsx`)
```javascript
function BackupStatus():
    // 1. On component mount:
    //    - Fetch servers and files from API
    //    - Format data for display
    // 2. Render data grid showing:
    //    - Hostname
    //    - IP Address
    //    - OS
    //    - Backup File
    //    - Backup Time
    //    - Status (with color-coded chip)
    // 3. Allow sorting and filtering
    // 4. Provide CSV/Excel export
```

#### Servers Page (`frontend/src/pages/Servers.jsx`)
```javascript
function Servers():
    // 1. Display list of discovered servers
    // 2. Show server details:
    //    - Hostname
    //    - IP
    //    - OS
    //    - Open ports
    // 3. Provide "Scan Servers" button
    // 4. Allow CSV export
```

#### Files Page (`frontend/src/pages/Files.jsx`)
```javascript
function Files():
    // 1. Display list of discovered backup files
    // 2. Show file details:
    //    - Filename
    //    - Path
    //    - Size
    //    - Last modified
    // 3. Allow CSV export
```

#### Directories Page (`frontend/src/pages/Directories.jsx`)
```javascript
function Directories():
    // 1. Display configured scan directories
    // 2. Provide "Scan Directories" button
    // 3. Show scan results
```

### 2. Shared Components

#### DataTable (`frontend/src/components/DataTable.jsx`)
```javascript
function DataTable(data, columns):
    // 1. Render MUI DataGrid with:
    //    - Sortable columns
    //    - Status filtering
    //    - Export buttons
    // 2. Handle background colors based on status
    // 3. Format dates and sizes
```

#### ScanButton (`frontend/src/components/ScanButton.jsx`)
```javascript
function ScanButton(onClick):
    // 1. Show loading state during scan
    // 2. Handle errors
    // 3. Provide visual feedback
```

## Application Flow

### Startup Process (`start-services-on-host.sh`)
```bash
1. Check and install dependencies (nmap)
2. Start backend service:
   - Run Flask app on port 5000
   - Initialize database if needed
3. Start frontend service:
   - Run npm dev server
4. Handle cleanup on shutdown
```

### Scanning Process
```
1. User initiates scan (manual or scheduled):
   a. Server Scan:
      - Scan configured subnets with nmap
      - Store results in database
   b. Directory Scan:
      - Scan configured directories
      - Store file info in database

2. Frontend periodically:
   - Fetches updated data
   - Updates UI with new status
   - Shows warnings for old/missing backups
```

### Backup Status Determination
```
For each server:
1. Find backup files matching hostname/IP
2. Get most recent backup's age
3. Determine status:
   - GREEN: backup < 1 year old
   - YELLOW: backup exists but > 1 year old
   - RED: no backup found
4. Update UI with status and details
```

## Configuration (`config.json`)
```json
{
    "directories_to_scan": [
        "./example/nas01/",
        "./example/nas02/"
    ],
    "subnets_to_scan": [
        "172.17.0.0/24",
        "10.197.38.0/24"
    ]
}
```

## Database Schema

### Table: scanned_files
```sql
CREATE TABLE scanned_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    last_modified TIMESTAMP,
    size INTEGER,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Table: scanned_servers
```sql
CREATE TABLE scanned_servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT NOT NULL,
    ip_address TEXT,
    detected_os TEXT,
    open_ports TEXT,
    last_scan TIMESTAMP,
    is_reachable BOOLEAN,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Security Notes
1. Requires root access for nmap scanning
2. Database file permissions set to 666 for shared access
3. CORS enabled for development
4. No authentication implemented yet

## Known Limitations
1. Backup file matching based on hostname/IP in filename
2. No standardized backup filename format
3. SQLite database (not suitable for large deployments)
4. Root access requirement for nmap