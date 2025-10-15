FROM python:3.10.15-bullseye

# Install all system libraries (keep them for runtime)
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    espeak \
    libasound2-dev \
    libespeak-dev \
    libxml2-dev \
    libxslt1-dev \
    python3-dev \
    build-essential \
    libatlas-base-dev \
    libsndfile1-dev \
    liblapack-dev \
    gfortran \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and core Python packages
RUN pip install --upgrade pip wheel setuptools cython numpy==1.23.5

# Copy requirements
COPY requirements.txt requirements_aeneas.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Install Aeneas from GitHub and compile C extensions in this environment
RUN pip install --no-cache-dir git+https://github.com/readbeyond/aeneas.git@master

# Verify installation
RUN python -m aeneas.diagnostics

# Copy your app
COPY . .

# Expose port and start server
EXPOSE 5000
CMD sh -c "gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600"
