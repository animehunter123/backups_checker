#!/bin/bash

# NOTE
# This is isn't ideal for production use. Our webapp requires root access b/c of nmap
# Thus, I normally have a venv for python and npm installed on the host's root, and launch it via:
# sudo bash -c 'source /root/venv/bin/activate ; cd /home/p*/dev/backup_checker ; ./start-services-on-host.sh'

# First make sure your host is Ubuntu, your middle name is root, and you have sudo/nmap
if [ "$EUID" -ne 0 ]; then
    echo "Not root'ed! Elevating privileges, and restarting script..."
    exec sudo "$0" "$@"
fi

if ! command -v nmap &> /dev/null
then
    echo "nmap not found. Installing..."
    if command -v apt-get &> /dev/null
    then
        sudo apt-get update
        sudo apt-get install -y nmap
    elif command -v yum &> /dev/null
    then
        sudo yum update
        sudo yum install -y nmap
    else
        echo "Unable to install nmap. Package manager not found."
        exit 1
    fi
else
    echo "nmap is already installed."
fi

# Check if vite is installed
if ! command -v vite &> /dev/null
then
    echo "vite not found. Installing..."
    if command -v npm &> /dev/null
    then
        sudo npm install -g vite
    else
        echo "Unable to install vite. npm not found."
        exit 1
    fi
else
    echo "vite is already installed."
fi

# Install python-nmap (THIS IS HORRIBLE WAY TO DO THIS!!!!!!!!!!!!!! #FIX #TODO)
sudo pip3 install python-nmap --break-system-packages # WARNING THIS IS HORRIBLE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

# Store the script's PID
SCRIPT_PID=$$

# Function to cleanup child processes
cleanup() {
    echo "Shutting down services..."
    # Kill all child processes in the process group
    pkill -P $SCRIPT_PID
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend service
echo "Starting backend service..."
cd backend
python3 app.py &
BACKEND_PID=$!

# Start frontend service
echo "Starting frontend service..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "All services started. Press Ctrl+C to stop all services."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Wait for any child process to exit
wait