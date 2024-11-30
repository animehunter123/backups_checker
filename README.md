# Description

A webapp to check if all currently reachable servers have at a backup file in the specified target directories.

<img width="964" alt="Sample Photo of Backup Checker Web App" src="https://github.com/user-attachments/assets/147e789a-9b0e-4165-a1d1-d5630deb8b62">

# Milestone Goals

- [ ] Add a list of servers to check (using pypimap to fetch hostname, ip, ports, last scan time)
- [ ] Add a list of target directories to scan recurisvely (to fetch filenames)
- [ ] Add a database to store the list of servers and target directories (For now sqlite is fine, no need for DBMS like PostgreSQL or others yet).
- [ ] Add a backend api to allow launching scan_servers and scan_directories
- [ ] Add a frontend to allow user input

# To Do

* Fix Navbar

* Add button to clear files from database, another button to clear servers from database

* Add spinners to make the user aware they need to wait

* Add maybe a log status modal that shows the status as it is nmap scanning, or if it is directory scanning

* Ensure the requirements.txt has flask, python-nmap, requests, and urllib3

* Front end requirements: cd frontend && npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material axios // npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material axios ; npm install