# Description

A webapp to check if all currently reachable servers have at a backup file in the specified target directories.

# Milestone Goals

- [ ] Add a list of servers to check (using pypimap to fetch hostname, ip, ports, last scan time)
- [ ] Add a list of target directories to scan recurisvely (to fetch filenames)
- [ ] Add a backend api to allow launching scan_servers and scan_directories
- [ ] Add a frontend to allow user input

# To Do

* Create Vite Front End, and Python Backend for 1. Scanning Live Network, 2. Scanning Directories