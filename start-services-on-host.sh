#!/bin/bash

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