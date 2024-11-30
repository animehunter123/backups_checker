FROM python:3.9

# Install nmap
RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Create example directories if they don't exist
RUN mkdir -p example/nas01 example/nas02

# Make sure the app runs with root privileges for nmap
USER root

EXPOSE 5000

# Run with Gunicorn
CMD ["gunicorn", "--config", "gunicorn_config.py", "app:app"]
