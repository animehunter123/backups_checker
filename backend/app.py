#!/usr/bin/env python3

# IMPORTANT!!!!!!
# You need to run this script with sudo privileges!!!!!! THIS IS BECAUSE WE USE NMAP PIP MODULE HERE
# sudo python3 app.py
# OTHERWISE YOU WILL GET THIS ERROR:
# OSError: [Errno 13] Permission denied: '/var/run/nmap/nmap.sock'
# OR... POST 500 ERRORS: 127.0.0.1 - - [30/Nov/1998 22:45:38] "POST /api/scan/servers HTTP/1.1" 500 -

from flask import Flask, jsonify, request
from flask_cors import CORS
from database.db_manager import DatabaseManager
from datetime import datetime, timedelta
import os
from pathlib import Path
import re
import json
from scan_dirs.scan_dirs import DirectoryScanner
from scan_servers.scan_servers import SubnetScanner

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
db_manager = DatabaseManager()

def format_timestamp(timestamp):
    """Convert timestamp to ISO format string."""
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp)
        except ValueError:
            return timestamp
    return timestamp.isoformat() if timestamp else None

def get_backup_status(server, files):
    """
    Determine backup status for a server based on matching files.
    Returns: 'green', 'yellow', or 'red' based on backup age.
    green = backup is less than 1 year old
    yellow = backup exists but is more than 1 year old
    red = no backup exists
    """
    server_identifiers = [
        server['hostname'].lower(),
        server['ip_address'].lower() if server['ip_address'] else None
    ]
    
    matching_files = []
    for file in files:
        filename_lower = file['filename'].lower()
        if any(id and id in filename_lower for id in server_identifiers if id):
            matching_files.append(file)
    
    if not matching_files:
        return 'red'  # No backup exists
    
    # Find most recent backup
    most_recent = max(matching_files, key=lambda x: x['last_modified'])
    last_modified = datetime.fromisoformat(most_recent['last_modified'])
    age = datetime.now() - last_modified
    
    # Check backup age
    if age <= timedelta(days=365):
        return 'green'  # Less than 1 year old
    else:
        return 'yellow'  # Backup exists but is more than 1 year old

@app.route('/api/files', methods=['GET'])
def get_files():
    """Get all scanned files from the database."""
    try:
        files = db_manager.get_all_scanned_files()
        formatted_files = []
        
        for file in files:
            formatted_files.append({
                'id': file[0],
                'filename': file[1],
                'filepath': file[2],
                'last_modified': format_timestamp(file[3]),
                'size': file[4],
                'scan_time': format_timestamp(file[5])
            })
        
        # Sort by query parameter if provided
        sort_by = request.args.get('sort')
        if sort_by:
            reverse = request.args.get('order', 'asc') == 'desc'
            formatted_files.sort(key=lambda x: x.get(sort_by, ''), reverse=reverse)
        
        return jsonify({
            'status': 'success',
            'count': len(formatted_files),
            'files': formatted_files
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/servers', methods=['GET'])
def get_servers():
    """Get all scanned servers with their backup status."""
    try:
        servers = db_manager.get_all_servers()
        files = db_manager.get_all_scanned_files()
        
        # Format servers
        formatted_servers = []
        formatted_files = []
        
        # Format files for backup checking
        for file in files:
            formatted_files.append({
                'filename': file[1],
                'filepath': file[2],
                'last_modified': format_timestamp(file[3])
            })
        
        # Format and check backup status for each server
        for server in servers:
            server_data = {
                'id': server[0],
                'hostname': server[1],
                'ip_address': server[2],
                'detected_os': server[3],
                'open_ports': server[4],
                'last_scan': format_timestamp(server[5]),
                'is_reachable': bool(server[6]),
                'scan_time': format_timestamp(server[7])
            }
            server_data['backup_status'] = get_backup_status(server_data, formatted_files)
            formatted_servers.append(server_data)
        
        # Sort by query parameter if provided
        sort_by = request.args.get('sort')
        if sort_by:
            reverse = request.args.get('order', 'asc') == 'desc'
            formatted_servers.sort(key=lambda x: x.get(sort_by, ''), reverse=reverse)
        
        return jsonify({
            'status': 'success',
            'count': len(formatted_servers),
            'servers': formatted_servers
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/scan/directories', methods=['POST'])
def scan_directories():
    """Trigger a directory scan."""
    try:
        config_path = Path(__file__).parent / 'config.json'
        scanner = DirectoryScanner(db_manager, str(config_path))
        results = scanner.scan_directories()
        
        if results:
            total_files = sum(len(files) for files in results.values())
            return jsonify({
                'status': 'success',
                'message': f'Directory scan completed successfully. Found {total_files} files.'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'No files found during scan'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/scan/servers', methods=['POST'])
def scan_servers():
    """Trigger a server scan."""
    try:
        # Check for root privileges
        if os.geteuid() != 0:
            return jsonify({
                'status': 'error',
                'message': 'Server scanning requires root privileges. Please run the Flask app with sudo.'
            }), 500
            
        config_path = Path(__file__).parent / 'config.json'
        scanner = SubnetScanner(db_manager, str(config_path))
        results = scanner.scan_all_subnets()
        
        if results:
            return jsonify({
                'status': 'success',
                'message': f'Server scan completed successfully. Found {len(results)} servers.'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'No servers found during scan'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get the current configuration."""
    try:
        with open('config.json', 'r') as f:
            config = f.read()
        return config, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update the configuration file."""
    try:
        print("Received config update request")
        config = request.get_json()
        print("Received config data:", json.dumps(config, indent=2))
        
        # Validate the configuration structure
        if not isinstance(config, dict):
            print("Error: Config is not a dictionary")
            return jsonify({'error': 'Invalid configuration format'}), 400
        
        required_fields = ['directories_to_scan', 'subnets_to_scan']
        for field in required_fields:
            if field not in config:
                print(f"Error: Missing field {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
            if not isinstance(config[field], list):
                print(f"Error: {field} is not a list")
                return jsonify({'error': f'{field} must be a list'}), 400
            
            # Filter out empty strings and validate non-empty values
            original_values = config[field]
            filtered_values = [item.strip() for item in config[field] if item and item.strip()]
            print(f"Field {field}:")
            print(f"  Original values: {original_values}")
            print(f"  Filtered values: {filtered_values}")
            config[field] = filtered_values
        
        print("Final config to save:", json.dumps(config, indent=2))
        
        # Write the new configuration
        with open('config.json', 'w') as f:
            json.dump(config, f, indent=4)
        
        print("Config saved successfully")
        return jsonify({'message': 'Configuration updated successfully'}), 200
    except Exception as e:
        print(f"Error updating config: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)