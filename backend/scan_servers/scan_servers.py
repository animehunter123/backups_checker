#!/usr/bin/env python3

import os
import json
import subprocess
from datetime import datetime
import sys
from pathlib import Path
import nmap
import socket
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add the parent directory to the Python path to import the database module
sys.path.append(str(Path(__file__).parent.parent))
from database.db_manager import DatabaseManager

def check_root():
    """Check if script is running with root privileges."""
    return os.geteuid() == 0

def restart_with_sudo():
    """Restart the script with sudo privileges."""
    print("Nmap scanning requires root privileges. Requesting sudo access...")
    try:
        args = ['sudo', sys.executable] + sys.argv
        os.execvp('sudo', args)
    except Exception as e:
        print(f"Error elevating privileges: {e}")
        sys.exit(1)

class SubnetScanner:
    def __init__(self, db_manager: DatabaseManager, config_path: str):
        self.db_manager = db_manager
        self.config_path = config_path
        self.subnets = self._load_config()
        self.nm = nmap.PortScanner()

    def _load_config(self) -> list:
        """Load subnets from config file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                return config.get('subnets_to_scan', [])
        except Exception as e:
            print(f"Error loading config file: {e}")
            return []

    def scan_host(self, ip_address: str) -> Dict:
        """
        Scan a single host using fast nmap settings.
        Returns a dictionary with host information.
        """
        try:
            # Fast scan settings:
            # -n: No DNS resolution
            # -T4: Aggressive timing template
            # -F: Fast scan (top 100 ports)
            # --min-parallelism 100: Increase parallel probe attempts
            # --max-retries 1: Minimize retries
            # -O: OS detection (might need sudo)
            scan_args = '-n -T4 -F --min-parallelism 100 --max-retries 1 -O'
            
            self.nm.scan(ip_address, arguments=scan_args)
            
            if ip_address not in self.nm.all_hosts():
                return None

            host_info = self.nm[ip_address]
            
            # Get hostname (reverse DNS)
            try:
                hostname = socket.gethostbyaddr(ip_address)[0]
            except socket.herror:
                hostname = ip_address

            # Get OS information
            if 'osmatch' in host_info:
                os_info = host_info['osmatch'][0]['name']
            else:
                os_info = 'Unknown'

            # Get open ports
            open_ports = []
            for proto in host_info.all_protocols():
                ports = host_info[proto].keys()
                for port in ports:
                    service = host_info[proto][port]
                    open_ports.append(f"{port}/{proto} ({service.get('name', 'unknown')})")
            
            open_ports_str = ', '.join(open_ports) if open_ports else None

            return {
                'hostname': hostname,
                'ip_address': ip_address,
                'detected_os': os_info,
                'open_ports': open_ports_str,
                'is_reachable': True,
                'last_scan': datetime.now()
            }

        except Exception as e:
            print(f"Error scanning host {ip_address}: {e}")
            return None

    def scan_subnet(self, subnet: str) -> List[Dict]:
        """
        Scan a subnet for live hosts and their information.
        Uses fast ping scan first to identify live hosts.
        """
        results = []
        try:
            # Fast ping scan to find live hosts
            # -n: No DNS resolution
            # -sn: Ping scan only
            # --min-parallelism 100: Increase parallel probe attempts
            print(f"Scanning subnet: {subnet}")
            self.nm.scan(hosts=subnet, arguments='-n -sn --min-parallelism 100')
            
            # Get list of responding hosts
            live_hosts = [x for x in self.nm.all_hosts() if self.nm[x].state() == 'up']
            print(f"Found {len(live_hosts)} live hosts in {subnet}")

            # Scan live hosts in parallel
            with ThreadPoolExecutor(max_workers=20) as executor:
                future_to_ip = {executor.submit(self.scan_host, ip): ip for ip in live_hosts}
                
                for future in as_completed(future_to_ip):
                    ip = future_to_ip[future]
                    try:
                        host_result = future.result()
                        if host_result:
                            # Update database
                            self.db_manager.update_server(host_result['hostname'], host_result)
                            results.append(host_result)
                            print(f"Scanned {ip}: {len(results)} hosts processed")
                    except Exception as e:
                        print(f"Error processing {ip}: {e}")

        except Exception as e:
            print(f"Error scanning subnet {subnet}: {e}")
            
        return results

    def scan_all_subnets(self) -> List[Dict]:
        """
        Scan all configured subnets.
        Returns a list of all scan results.
        """
        all_results = []
        
        for subnet in self.subnets:
            subnet_results = self.scan_subnet(subnet)
            all_results.extend(subnet_results)
            
        return all_results

def main():
    # Check for root privileges
    if not check_root():
        restart_with_sudo()
    
    # Initialize database manager
    db_manager = DatabaseManager()
    
    # Get config file path
    config_path = os.path.join(Path(__file__).parent.parent, 'config.json')
    scanner = SubnetScanner(db_manager, config_path)
    
    # Scan all configured subnets
    results = scanner.scan_all_subnets()
    
    # Print summary
    print("\nScan Summary:")
    print(f"Total hosts found: {len(results)}")
    for result in results:
        print(f"\nHost: {result['hostname']} ({result['ip_address']})")
        print(f"  OS: {result['detected_os']}")
        if result['open_ports']:
            print(f"  Open Ports: {result['open_ports']}")

if __name__ == "__main__":
    main()