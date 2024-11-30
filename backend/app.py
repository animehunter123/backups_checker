#!/usr/bin/env python3

from flask import Flask, jsonify
from database.db_manager import DatabaseManager
from datetime import datetime
import os
from pathlib import Path

app = Flask(__name__)
db_manager = DatabaseManager()

def format_timestamp(timestamp):
    """Convert timestamp to ISO format string."""
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp)
        except ValueError:
            return timestamp
    return timestamp.isoformat() if timestamp else None

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
    """Get all scanned servers from the database."""
    try:
        servers = db_manager.get_all_servers()
        formatted_servers = []
        
        for server in servers:
            formatted_servers.append({
                'id': server[0],
                'hostname': server[1],
                'ip_address': server[2],
                'detected_os': server[3],
                'open_ports': server[4],
                'last_scan': format_timestamp(server[5]),
                'is_reachable': bool(server[6]),
                'scan_time': format_timestamp(server[7])
            })
        
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