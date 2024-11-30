# Description

A webapp to check if all currently reachable servers have at a backup file in the specified target directories.

<img width="964" alt="Sample Photo of Backup Checker Web App" src="https://github.com/user-attachments/assets/7a4b66d0-8c36-4955-ba20-2c488b73a7a6">

# Milestone Goals

- [ ] Add a list of servers to check (using pypimap to fetch hostname, ip, ports, last scan time)
- [ ] Add a list of target directories to scan recurisvely (to fetch filenames)
- [ ] Add a database to store the list of servers and target directories (For now sqlite is fine, no need for DBMS like PostgreSQL or others yet).
- [ ] Add a backend api to allow launching scan_servers and scan_directories
- [ ] Add a frontend to allow user input.

# To Do

* The scan servers and scan directories button does not directly run ./scan_servers or .scan_directories

* Add some type of H1 to explain what this app does, its not easy to understand what this app does atm

* Fix Navbar (its not expanded completely), use tailwind css for styling (instead of the boring bootstrap) --> Actually I think Material UI is the way to go!!!

* add the filename to the backup status (with its original timestamp as well)

* add a search bar and filter for the backup status

* offline the cdn dependencies into the ./public

* Add button to clear files from database, another button to clear servers from database

* Add spinners to make the user aware they need to wait

* Add maybe a log status modal that shows the status as it is nmap scanning, or if it is directory scanning

* Ensure the requirements.txt has flask, python-nmap, requests, and urllib3

* Front end requirements: cd frontend && npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material axios // npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material axios ; npm install

## Docker Setup

The application can be run using Docker and Docker Compose. This setup includes both the frontend and backend services.

### Prerequisites

- Docker
- Docker Compose

### Running with Docker

1. Clone the repository
2. Configure your backup directories in `backend/config.json`:
   ```json
   {
     "directories": [
       "/app/example/nas01",
       "/app/example/nas02"
     ],
     "subnets": [
       "192.168.1.0/24"
     ]
   }
   ```
   Note: Directories should be specified relative to the container's `/app` directory.

3. Start the services:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Adding Custom Backup Directories

To monitor additional backup directories:

1. Mount your directories in docker-compose.yml under the backend service:
   ```yaml
   volumes:
     - /path/to/your/backup:/app/custom-backup:ro
   ```

2. Update the paths in `backend/config.json` to include the new mounted directory:
   ```json
   {
     "directories": [
       "/app/custom-backup"
     ]
   }
   ```

### Security Note

The backend container runs with elevated privileges (required for nmap scanning). The example directories are mounted as read-only for security.