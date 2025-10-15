# Base image
FROM python:3.10

# --- System dependencies ---
RUN apt-get update && apt-get install -y \
    ffmpeg \
    espeak \
    libasound2-dev \
    libespeak-dev \
    libxml2-dev \
    libxslt1-dev \
    python3-dev \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# --- Set working directory ---
WORKDIR /app

# --- Copy your requirements first ---
COPY requirements.txt requirements_aeneas.txt ./

# --- Install core Python build tools + numpy (required for aeneas build) ---
RUN pip install --upgrade pip "setuptools<60" wheel cython numpy==1.23.5

# --- Build and install aeneas from source with C extensions ---
RUN git clone https://github.com/readbeyond/aeneas.git /tmp/aeneas && \
    cd /tmp/aeneas && \
    python setup.py build_ext --inplace && \
    python setup.py install && \
    cd / && rm -rf /tmp/aeneas

# --- Install your app requirements (Flask, Gunicorn, Pydub, etc.) ---
RUN pip install --no-cache-dir -r requirements.txt

# --- Copy your app code ---
COPY . .

# --- Expose port and start server ---
EXPOSE 5000
ENV PORT=5000
CMD gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600
