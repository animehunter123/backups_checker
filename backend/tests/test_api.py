#!/usr/bin/env python3

import unittest
import sys
import os
from pathlib import Path
import json
import requests
from datetime import datetime, timedelta

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))
from database.db_manager import DatabaseManager

class TestBackupCheckerAPI(unittest.TestCase):
    """Test cases for Backup Checker API endpoints."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        cls.base_url = 'http://localhost:5000/api'
        cls.db_manager = DatabaseManager()
        
        # Add some test data
        cls._add_test_data()
    
    @classmethod
    def _add_test_data(cls):
        """Add test data to the database."""
        # Clear existing data
        cls.db_manager.clear_scanned_files()
        cls.db_manager.clear_scanned_servers()
        
        # Add test files
        test_files = [
            ('test1.txt', '/path/to/test1.txt', datetime.now(), 1024),
            ('test2.txt', '/path/to/test2.txt', datetime.now() - timedelta(days=1), 2048)
        ]
        
        for filename, filepath, last_modified, size in test_files:
            cls.db_manager.add_scanned_file(filename, filepath, last_modified, size)
        
        # Add test servers
        test_servers = [
            {
                'hostname': 'test-server-1',
                'data': {
                    'ip_address': '192.168.1.100',
                    'detected_os': 'Ubuntu 22.04',
                    'open_ports': '22,80,443',
                    'last_scan': datetime.now(),
                    'is_reachable': True
                }
            },
            {
                'hostname': 'test-server-2',
                'data': {
                    'ip_address': '192.168.1.101',
                    'detected_os': 'Windows Server 2019',
                    'open_ports': '3389,445',
                    'last_scan': datetime.now() - timedelta(days=1),
                    'is_reachable': False
                }
            }
        ]
        
        for server in test_servers:
            cls.db_manager.update_server(server['hostname'], server['data'])
    
    def test_health_check(self):
        """Test the health check endpoint."""
        response = requests.get(f'{self.base_url}/health')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database'], 'connected')
        self.assertIn('timestamp', data)
    
    def test_get_files(self):
        """Test the files endpoint."""
        response = requests.get(f'{self.base_url}/files')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['count'], 2)  # We added 2 test files
        
        files = data['files']
        self.assertEqual(len(files), 2)
        
        # Check first file
        file1 = next(f for f in files if f['filename'] == 'test1.txt')
        self.assertEqual(file1['filepath'], '/path/to/test1.txt')
        self.assertEqual(file1['size'], 1024)
        
        # Check second file
        file2 = next(f for f in files if f['filename'] == 'test2.txt')
        self.assertEqual(file2['filepath'], '/path/to/test2.txt')
        self.assertEqual(file2['size'], 2048)
    
    def test_get_servers(self):
        """Test the servers endpoint."""
        response = requests.get(f'{self.base_url}/servers')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['count'], 2)  # We added 2 test servers
        
        servers = data['servers']
        self.assertEqual(len(servers), 2)
        
        # Check first server
        server1 = next(s for s in servers if s['hostname'] == 'test-server-1')
        self.assertEqual(server1['ip_address'], '192.168.1.100')
        self.assertEqual(server1['detected_os'], 'Ubuntu 22.04')
        self.assertEqual(server1['open_ports'], '22,80,443')
        self.assertTrue(server1['is_reachable'])
        
        # Check second server
        server2 = next(s for s in servers if s['hostname'] == 'test-server-2')
        self.assertEqual(server2['ip_address'], '192.168.1.101')
        self.assertEqual(server2['detected_os'], 'Windows Server 2019')
        self.assertEqual(server2['open_ports'], '3389,445')
        self.assertFalse(server2['is_reachable'])

def main():
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestBackupCheckerAPI)
    
    # Run tests
    print("\nRunning API Tests...")
    print("=" * 80)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print("=" * 80)
    
    # Print summary
    print(f"\nTest Summary:")
    print(f"Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    
    # Return 0 if all tests passed, 1 otherwise
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    sys.exit(main())
