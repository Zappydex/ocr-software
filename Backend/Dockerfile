# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive

# Set the working directory in the container
WORKDIR /app

# Install system dependencies including Node.js and npm
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    libmagic1 \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*
    
COPY Backend/requirements.txt .
RUN pip install --upgrade pip && \
    for i in 1 2 3 4 5; do \
        pip install --no-cache-dir -r requirements.txt && break || \
        echo "Retry attempt $i..." && \
        sleep 5; \
    done

# Make sure spaCy is installed before downloading the model
RUN pip install spacy && python -m spacy download en_core_web_sm

# Copy and build frontend (do this before switching to non-root user)
COPY frontend/ /app/frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build
WORKDIR /app

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser

# Create necessary directories and set permissions
RUN mkdir -p /var/log/app /var/run /app/logs && \
    chown -R appuser:appuser /app /var/log/app /var/run

# Copy the backend directory contents into the container
COPY --chown=appuser:appuser Backend/ /app/

# Copy the template folder into the container
COPY --chown=appuser:appuser Backend/template /app/template

# Handle Google credentials from environment variable instead of copying file
RUN if [ -n "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ]; then \
    echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /app/google_credentials.json && \
    chmod 600 /app/google_credentials.json; \
fi

# Switch to non-root user
USER appuser

# Make ports available to the world outside this container
EXPOSE 10000 8001

# Set memory limit for Gunicorn workers
ENV GUNICORN_CMD_ARGS="--workers=2 --worker-class=uvicorn.workers.UvicornWorker --timeout=300 --max-requests=1000 --max-requests-jitter=50"

# Run both FastAPI and Django applications in production mode
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --log-level info & \
    python manage.py makemigrations && \
    python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn --bind 0.0.0.0:8001 config.wsgi:application --access-logfile /var/log/app/django.access.log --error-logfile /var/log/app/django.error.log & \
    wait

# Commented out alternatives kept for reference
#CMD gunicorn --bind 0.0.0.0:${PORT:-10000} app.main:app \
#    --access-logfile /var/log/app/gunicorn.access.log \
#    --error-logfile /var/log/app/gunicorn.error.log

# Celery workers and beat scheduler are commented out but kept for future use
# CMD gunicorn --bind 0.0.0.0:${PORT:-10000} app.main:app \
#     --access-logfile /var/log/app/gunicorn.access.log \
#     --error-logfile /var/log/app/gunicorn.error.log & \
#     celery -A app.celery_app worker --loglevel=INFO -E --concurrency=1 \
#     -Q celery \
#     --max-memory-per-child=128000 \
#     --logfile=/var/log/app/celery_worker.log & \
#     celery -A app.celery_app beat --loglevel=INFO \
#     --logfile=/var/log/app/celery_beat.log & \
#     wait
