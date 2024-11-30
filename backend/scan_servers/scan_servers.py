import os
import json
import subprocess
from datetime import datetime
import sys
from pathlib import Path
import json
import nmap
import socket
from typing import Dict, List, Optional

# Add the parent directory to the Python path to import the database module
sys.path.append(str(Path(__file__).parent.parent))
from database.db_manager import DatabaseManager

class ServerScanner:
    def __init__(self, db_manager: DatabaseManager, config_path: str):
        self.db_manager = db_manager
        self.config_path = config_path
        self.servers = self._load_config()
        self.nm = nmap.PortScanner()

    def _load_config(self) -> list:
        """Load servers from config file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                return config.get('servers_to_scan', [])
        except Exception as e:
            print(f"Error loading config file: {e}")
            return []

    def ping_host(self, hostname: str) -> bool:
        """Check if a host is reachable using ping."""
        try:
            # Using ping with a timeout of 2 seconds and 2 packets
            result = subprocess.run(
                ['ping', '-c', '2', '-W', '2', hostname],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            return result.returncode == 0
        except Exception:
            return False

    def scan_server(self, hostname: str) -> Dict:
        """
        Scan a single server using nmap and ping.
        Returns a dictionary with server information.
        """
        try:
            # First check if host is reachable
            is_reachable = self.ping_host(hostname)
            if not is_reachable:
                return {
                    'hostname': hostname,
                    'ip_address': None,
                    'detected_os': None,
                    'open_ports': None,
                    'is_reachable': False,
                    'last_scan': datetime.now()
                }

            # Get IP address
            try:
                ip_address = socket.gethostbyname(hostname)
            except socket.gaierror:
                ip_address = None

            # Perform nmap scan
            try:
                # Scan with OS detection (-O) and version detection (-sV)
                self.nm.scan(hostname, arguments='-O -sV')
                
                # Get OS information
                if 'osmatch' in self.nm[hostname]:
                    os_info = self.nm[hostname]['osmatch'][0]['name']
                else:
                    os_info = 'Unknown'

                # Get open ports
                open_ports = []
                for proto in self.nm[hostname].all_protocols():
                    ports = self.nm[hostname][proto].keys()
                    for port in ports:
                        service = self.nm[hostname][proto][port]
                        open_ports.append(f"{port}/{proto} ({service.get('name', 'unknown')})")
                
                open_ports_str = ', '.join(open_ports)

            except Exception as e:
                print(f"Error during nmap scan of {hostname}: {e}")
                os_info = 'Scan failed'
                open_ports_str = None

            return {
                'hostname': hostname,
                'ip_address': ip_address,
                'detected_os': os_info,
                'open_ports': open_ports_str,
                'is_reachable': True,
                'last_scan': datetime.now()
            }

        except Exception as e:
            print(f"Error scanning server {hostname}: {e}")
            return None

    def scan_servers(self) -> List[Dict]:
        """
        Scan all configured servers and store information in the database.
        Returns a list of scan results.
        """
        results = []
        
        for hostname in self.servers:
            print(f"Scanning server: {hostname}")
            scan_result = self.scan_server(hostname)
            
            if scan_result:
                # Update database
                self.db_manager.update_server(hostname, scan_result)
                results.append(scan_result)
            
        return results

def main():
    # Initialize database manager
    db_manager = DatabaseManager()
    
    # Get config file path
    config_path = os.path.join(Path(__file__).parent.parent, 'config.json')
    scanner = ServerScanner(db_manager, config_path)
    
    # Scan all configured servers
    results = scanner.scan_servers()
    
    # Print results
    print("\nScan Results:")
    for result in results:
        print(f"\nServer: {result['hostname']}")
        print(f"  IP Address: {result['ip_address']}")
        print(f"  Reachable: {result['is_reachable']}")
        if result['is_reachable']:
            print(f"  Detected OS: {result['detected_os']}")
            print(f"  Open Ports: {result['open_ports']}")
        print(f"  Last Scan: {result['last_scan']}")

if __name__ == "__main__":
    main()