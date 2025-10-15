# Use the same Python version as your pyenv environment
FROM python:3.10.15-slim

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
    git \
 && rm -rf /var/lib/apt/lists/*

# --- Set working directory ---
WORKDIR /app

# --- Copy your requirements first ---
COPY requirements.txt requirements_aeneas.txt ./

# --- Make sure shared libs are discoverable (like pyenv’s --enable-shared setup) ---
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
ENV LIBRARY_PATH=/usr/local/lib:$LIBRARY_PATH
ENV C_INCLUDE_PATH=/usr/local/include:$C_INCLUDE_PATH
ENV CPLUS_INCLUDE_PATH=/usr/local/include:$CPLUS_INCLUDE_PATH

# --- Install base build tools and numpy for aeneas ---
RUN pip install --upgrade pip "setuptools<60" wheel cython numpy==1.23.5

# --- Clone and build Aeneas from source (with C extensions) ---
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

# --- Start your app with Gunicorn ---
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:5000", "--timeout", "600"]
