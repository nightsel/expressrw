# Base image
FROM python:3.10

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    espeak \
    libespeak-dev \
    libespeak-ng1 \
    libasound2 \
    ffmpeg \
    git \
    python3-dev \
    gcc \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements files
COPY requirements_aeneas.txt requirements.txt ./

# Install Python deps
RUN pip install --upgrade pip "setuptools<60" wheel \
    && pip install "numpy<1.24" \
    && pip install --no-build-isolation -r requirements_aeneas.txt \
    && pip install -r requirements.txt

RUN git clone https://github.com/readbeyond/aeneas.git /tmp/aeneas && \
    cd /tmp/aeneas && \
    python -m pip install --upgrade pip "setuptools<60" wheel && \
    python setup.py build_ext --inplace && \
    python setup.py install && \
    cd / && rm -rf /tmp/aeneas

COPY . .

EXPOSE 5000
ENV PORT=5000

CMD gunicorn server:app --bind 0.0.0.0:$PORT --timeout 600
