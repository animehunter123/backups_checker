# Description

A webapp to check if all currently reachable servers have at a backup file in the specified target directories.

<img width="964" alt="Sample Photo of Backup Checker Web App" src="https://github.com/user-attachments/assets/d31a7316-8f4d-459b-b008-09248d93d581">

# Milestone Goals

- [ ] Add a list of servers to check (using pypimap to fetch hostname, ip, ports, last scan time)
- [ ] Add a list of target directories to scan recurisvely (to fetch filenames)
- [ ] Add a database to store the list of servers and target directories (For now sqlite is fine, no need for DBMS like PostgreSQL or others yet).
- [ ] Add a backend api to allow launching scan_servers and scan_directories
- [ ] Add a frontend to allow user input.

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

i.e., just use ```docker-compose up --build```







# To Do

* Still a "best effort" to assume backup files match the hostname/ip... we dont have a standardized filenaming format for acronis or tar backups so you might get a false positive like this:
```
10.197.38.12 <--- even though your target server IP is really 10.197.38.1 <-- This is a case I cannot handle with this webapp idea unfortunately.!!!
```

* need the docker-compose for both webapps to allow HMR modification of code (not COPY . . the code into the container into a read-only directory)

* need to make the CDN's all become embedded into the app for homelab without internet

* Add some type of H1 to explain what this app does, its not easy to understand what this app does atm

* add a search bar and filter for the backup status

* Add button to clear files from database, another button to clear servers from database

* Add maybe a log status modal that shows the status as it is nmap scanning, or if it is directory scanning