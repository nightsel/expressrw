# --- Base image ---
FROM python:3.10.15

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
 && rm -rf /var/lib/apt/lists/*

# --- Working directory ---
WORKDIR /app

# --- Copy and install dependencies ---
COPY requirements.txt requirements_aeneas.txt ./
RUN pip install --upgrade pip "setuptools<60" wheel cython numpy==1.23.5
RUN pip install --no-cache-dir -r requirements.txt

# --- Build aeneas from source ---
RUN git clone https://github.com/readbeyond/aeneas.git /tmp/aeneas && \
    cd /tmp/aeneas && \
    python setup.py build_ext --force --inplace && \
    python setup.py install && \
    ls -R /usr/local/lib/python3.10/site-packages/aeneas && \
    cd / && rm -rf /tmp/aeneas

# --- Copy your app code ---
COPY . .

# --- Expose port and start server ---
EXPOSE 5000
ENV PORT=5000
CMD gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600
