# Stage 1: Build
FROM python:3.10.15-bullseye AS build
RUN apt-get update && apt-get install -y build-essential libatlas-base-dev libsndfile1-dev gfortran
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip wheel setuptools cython numpy
RUN pip install --no-cache-dir git+https://github.com/readbeyond/aeneas.git@master
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Stage 2: Runtime
FROM python:3.10.15-bullseye
WORKDIR /app
COPY --from=build /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY . .
EXPOSE 5000
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:5000", "--timeout", "600"]
