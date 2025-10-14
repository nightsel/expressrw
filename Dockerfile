# Base image
FROM python:3.10

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    espeak \
    libespeak-dev \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements files
COPY requirements_aeneas.txt requirements.txt ./

# Pin setuptools <60 to fix numpy.distutils issues
RUN pip install --upgrade pip "setuptools<60" wheel \
    && pip install "numpy<1.24" \
    && pip install --no-build-isolation -r requirements_aeneas.txt \
    && pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000
ENV PORT=5000

# Start server
CMD gunicorn server:app --bind 0.0.0.0:$PORT
