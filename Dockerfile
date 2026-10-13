# ==============================================================================
# CreatorIQ - Multi-Stage Production Dockerfile
# Stage 1: Build React Client (Vite)
# Stage 2: Fast, Slim Python 3.12 Backend (FastAPI + Uvicorn)
# ==============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci --silent || npm install --silent

COPY client/ ./
RUN npm run build

# --- Stage 2: Python Backend Runtime ---
FROM python:3.12-slim AS backend-runner

WORKDIR /app

# Install system dependencies (for PostgreSQL, Pillow/ReportLab, and network tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./server/requirements.txt

# Copy server application code
COPY server/ ./server/

# Copy built frontend assets from Stage 1 into server static directory
COPY --from=frontend-builder /app/client/dist ./server/static

# Expose FastAPI backend port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/server

WORKDIR /app/server

# Start production Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

