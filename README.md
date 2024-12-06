# Description

A webapp to check if all currently reachable servers have at a backup file in the specified target directories.

<img width="964" alt="Sample Photo of Backup Checker Web App" src="https://github.com/user-attachments/assets/d31a7316-8f4d-459b-b008-09248d93d581">

# Milestone Goals

- [ ] Add a list of servers to check (using pypimap to fetch hostname, ip, ports, last scan time)
- [ ] Add a list of target directories to scan recurisvely (to fetch filenames)
- [ ] Add a database to store the list of servers and target directories (For now sqlite is fine, no need for DBMS like PostgreSQL or others yet).
- [ ] Add a backend api to allow launching scan_servers and scan_directories
- [ ] Add a frontend to allow user input.

# To Do

* **<font color="red">Design Principle Problem</font>**: Still a "best effort" to assume backup files match the hostname/ip... we dont have a standardized filenaming format for acronis or tar backups so you might get a false positive like this

* convert the backend from python to nodejs for better performance. Lets use a new branch for this, git checkout -b nodejs-backend ; git add . ; git commit -m "convert backend to nodejs" ; git push -u origin nodejs-backend    --- and then in the cloud git clone, git checkout nodejs-backend, cd backend, npm install and good to go

... and then to merge...  merge the README.md FROM the nodejs branch, to the main ROOT BRANCH: git checkout main ; git add README.. done?
* settings button to edit the json config file from the front end (for example use npm install @mui/x-data-grid for the data grid)

* root is required for nmap, might need a better way, but for now:
```
To Launch App as root: 
sudo bash -c 'source /root/venv/bin/activate ; cd /home/p*/dev/backup_checker ; ./start-services-on-host.sh'

To Rebuild/Rescan SQlite database from scratchas root:
sudo bash -c 'rm - f /home/p*/dev/backup_checker/backend/backup_checker.db; source /root/venv/bin/activate ; cd /home/p*/dev/backup_checker/backend ; ./scan_dirs/scan_dirs.py ; ./scan_servers/scan_servers.py'

```

* config validation in frontend/backend is needed, for now it accepts anything (and still works, becareful to never add 0.0.0.0 to the list of servers to check)

* need the docker-compose for both webapps to allow HMR modification of code (not COPY . . the code into the container into a read-only directory), or just embed node into environment.

* need to make the CDN's all become embedded into the app for homelab without internet

* Add some type of H1 to explain what this app does, its not easy to understand what this app does atm

* add a search bar and filter for the backup status

* Add button to clear files from database, another button to clear servers from database

* Add maybe a log status modal that shows the status as it is nmap scanning, or if it is directory scanning