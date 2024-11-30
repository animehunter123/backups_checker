#!/usr/bin/env python3

from flask import Flask, jsonify, request
from flask_cors import CORS
from database.db_manager import DatabaseManager
from datetime import datetime, timedelta
import os
from pathlib import Path
import subprocess
import re

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
        return 'red'
    
    # Find most recent backup
    most_recent = max(matching_files, key=lambda x: x['last_modified'])
    last_modified = datetime.fromisoformat(most_recent['last_modified'])
    
    # Check if backup is within a year
    if datetime.now() - last_modified <= timedelta(days=365):
        return 'green'
    return 'yellow'

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
        script_path = Path(__file__).parent / 'scan_dirs' / 'scan_dirs.py'
        process = subprocess.Popen(['python3', str(script_path)], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            return jsonify({
                'status': 'success',
                'message': 'Directory scan completed successfully'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'Scan failed: {stderr.decode()}'
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
        script_path = Path(__file__).parent / 'scan_servers' / 'scan_servers.py'
        process = subprocess.Popen(['sudo', 'python3', str(script_path)], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            return jsonify({
                'status': 'success',
                'message': 'Server scan completed successfully'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'Scan failed: {stderr.decode()}'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # Try to connect to the database
        db_manager.get_all_scanned_files()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)