# Base image
FROM python:3.10

# --- System dependencies ---
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3-dev \
    libasound2-dev \
    libespeak-dev \
    espeak \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# --- Set working directory ---
WORKDIR /app

# --- Copy your requirements ---
COPY requirements_aeneas.txt requirements.txt ./

# --- Install Python build essentials first ---
RUN pip install --upgrade pip "setuptools<60" wheel cython

# --- Build and install aeneas from source with native extensions ---
RUN git clone https://github.com/readbeyond/aeneas.git /tmp/aeneas && \
    cd /tmp/aeneas && \
    python setup.py build_ext --inplace && \
    python setup.py install && \
    cd / && rm -rf /tmp/aeneas

# --- Install your app requirements ---
RUN pip install --no-cache-dir -r requirements.txt

# --- Copy your app ---
COPY . .

# --- Expose port and run server ---
EXPOSE 5000
ENV PORT=5000
CMD gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600
