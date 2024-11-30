#!/bin/bash

echo "Killing all python processes..."
pkill -f python

echo "Killing all npm processes..."
pkill -f npm

echo "Starting frontend..."
cd frontend
npm run dev &

echo "Starting backend..."
cd ../backend
python app.py

echo "To kill all processes, run:"
echo "pkill -f python"
echo "pkill -f npm"

echo "Script completed. All services started."