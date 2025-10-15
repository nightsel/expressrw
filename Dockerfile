# --- Base image ---
FROM python:3.10.15-bullseye

# --- System dependencies ---
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

# --- Working directory ---
WORKDIR /app

# --- Create a virtual environment ---
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# --- Upgrade pip and install basic Python packages ---
RUN pip install --upgrade pip "setuptools<60" wheel cython numpy==1.23.5

# --- Copy and install requirements ---
COPY requirements.txt requirements_aeneas.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# --- Copy prebuilt Aeneas wheel into the container ---
COPY wheelhouse/aeneas-*.whl /tmp/

# --- Install the prebuilt wheel (with compiled C extensions) ---
RUN pip install --no-cache-dir /tmp/aeneas-*.whl

# --- Optional: remove the wheel to reduce image size ---
RUN rm /tmp/aeneas-*.whl

# --- Verify Aeneas installation at runtime ---
RUN python -m aeneas.diagnostics

# --- Copy application code ---
COPY . .

# --- Expose port and start server ---
EXPOSE 5000
ENV PORT=5000
CMD sh -c "gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600"
