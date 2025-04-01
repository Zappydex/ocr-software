# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    libmagic1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    nginx \
    gettext-base \
    curl \
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

# Comment out Node.js installation and frontend build for now
# Install Node.js 16
# RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
#     apt-get install -y nodejs

# COPY frontend/ /app/frontend/
# WORKDIR /app/frontend
# Clear cache and configure npm with increased timeout and retries
# RUN npm cache clean --force && \
#     npm config set registry https://registry.npmjs.org/ && \
#     npm config set fetch-retry-mintimeout 20000 && \
#     npm config set fetch-retry-maxtimeout 120000 && \
#     npm config set fetch-retries 5 && \
#     npm install
# RUN npm run build
WORKDIR /app

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser

# Create all necessary directories and set permissions
RUN mkdir -p /var/log/app /var/run /app/logs /var/log/nginx && \
    mkdir -p /run && \
    mkdir -p /app/frontend/build/static && \
    mkdir -p /app/static && \
    mkdir -p /var/lib/nginx && \
    chown -R appuser:appuser /app /var/log/app /var/run /run /app/frontend /app/static /var/lib/nginx /var/log/nginx /etc/nginx

# Copy the backend directory contents into the container
COPY --chown=appuser:appuser Backend/ /app/

# Copy the template folder into the container
COPY --chown=appuser:appuser Backend/template /app/template

# Copy Nginx configuration
COPY Backend/nginx.conf /etc/nginx/nginx.conf.template

# Copy and set permissions for Google credentials
COPY --chown=appuser:appuser google_credentials.json /app/google_credentials.json
RUN chmod 600 /app/google_credentials.json

# Make ports available to the world outside this container
EXPOSE ${PORT:-10000}

# Create a startup script
RUN echo '#!/bin/bash\n\
# Debug PORT variable\n\
echo "PORT environment variable is: ${PORT}"\n\
\n\
# Start FastAPI on internal port\n\
uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info &\n\
\n\
# Start Django on internal port\n\
python manage.py makemigrations\n\
python manage.py migrate\n\
python manage.py collectstatic --noinput\n\
gunicorn --bind 127.0.0.1:8001 config.wsgi:application --access-logfile /var/log/app/django.access.log --error-logfile /var/log/app/django.error.log &\n\
\n\
# Replace PORT in nginx config\n\
envsubst "\$PORT" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf\n\
\n\
# Update nginx.conf to point to new FastAPI port\n\
sed -i "s/proxy_pass http:\\/\\/127.0.0.1:10000/proxy_pass http:\\/\\/127.0.0.1:8000/g" /etc/nginx/nginx.conf\n\
\n\
# Debug the generated nginx.conf\n\
echo "Generated nginx.conf:"\n\
cat /etc/nginx/nginx.conf | grep -A 5 "location /api/"\n\
\n\
# Start Nginx\n\
nginx -g "daemon off;"\n' > /app/start.sh && chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Run the startup script
CMD ["/app/start.sh"]

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
