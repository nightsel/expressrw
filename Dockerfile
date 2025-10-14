# Base image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3.10-distutils \
    espeak-ng \
    libespeak-ng-dev \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements files
COPY requirements_aeneas.txt requirements.txt ./

# Upgrade pip and install Python packages
RUN pip install --upgrade pip setuptools wheel \
    && pip install "numpy<1.24" \
    && pip install --no-build-isolation -r requirements_aeneas.txt \
    && pip install -r requirements.txt

# Copy application code
COPY . .

# Default command to run your app
EXPOSE 5000
CMD gunicorn server:app --bind 0.0.0.0:$PORT
