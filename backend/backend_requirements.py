# requirements.txt - Python Backend Dependencies for OR-BIT

# Core FastAPI and web framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0

# CORS and WebSocket support
python-socketio==5.10.0
websockets==12.0

# AI and Machine Learning
openai==1.3.0
scikit-learn==1.3.2
numpy==1.24.3
pandas==2.1.3
shap==0.43.0

# Data processing and validation
pydantic==2.5.0
httpx==0.25.2
aiofiles==23.2.1

# Logging and monitoring
structlog==23.2.0
rich==13.7.0

# Testing (optional for development)
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2

# Production deployment (optional)
gunicorn==21.2.0
prometheus-client==0.19.0

# Medical data processing (if needed)
pydicom==2.4.3
hl7==0.4.5

# Development tools
black==23.11.0
isort==5.12.0
flake8==6.1.0

"""
Installation instructions:

1. Create virtual environment:
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

2. Install dependencies:
   pip install -r requirements.txt

3. For development with auto-reload:
   pip install watchdog

4. For GPU support (optional):
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
"""

# .env.example - Environment Variables Template
ENV_TEMPLATE = """
# OR-BIT Environment Configuration

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# FastAPI Configuration
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_RELOAD=True

# Database Configuration (if using database)
DATABASE_URL=sqlite:///orbit.db
# DATABASE_URL=postgresql://user:password@localhost/orbit_db

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json

# Security Configuration
SECRET_KEY=your-secret-key-for-jwt-tokens
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Clinical Data Configuration
MIMIC_DATA_PATH=/path/to/mimic/data
SYNTHETIC_MODE=True

# Model Configuration
RISK_MODEL_PATH=./models/risk_model.pkl
FEATURE_SCALER_PATH=./models/scaler.pkl

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30
WS_MAX_CONNECTIONS=100

# Alert Configuration
ALERT_SOUND_ENABLED=True
ALERT_EMAIL_ENABLED=False
ALERT_EMAIL_SMTP_SERVER=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your-app-password

# Performance Configuration
MAX_VITALS_HISTORY=1000
DATA_RETENTION_HOURS=24
BACKGROUND_TASK_INTERVAL=3

# Integration Configuration
FHIR_SERVER_URL=http://localhost:8080/fhir
EHR_INTEGRATION_ENABLED=False

# Development Configuration
DEBUG=True
DEVELOPMENT_MODE=True
MOCK_DATA_ENABLED=True

# Production Configuration (for deployment)
SENTRY_DSN=your-sentry-dsn-for-error-tracking
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379
"""

# docker-compose.yml - Docker Compose for Development
DOCKER_COMPOSE = """
version: '3.8'

services:
  # OR-BIT Backend
  orbit-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://orbit_user:orbit_pass@postgres:5432/orbit_db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - ./data:/app/data
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # OR-BIT Frontend
  orbit-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - orbit-backend
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: orbit_db
      POSTGRES_USER: orbit_user
      POSTGRES_PASSWORD: orbit_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis for Caching and WebSocket
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Nginx Reverse Proxy (optional)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - orbit-frontend
      - orbit-backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: orbit-network
"""

# Dockerfile for Backend
BACKEND_DOCKERFILE = """
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for models and data
RUN mkdir -p /app/models /app/data /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
"""

# Dockerfile for Frontend
FRONTEND_DOCKERFILE = """
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
"""

# Makefile for development
MAKEFILE = """
# OR-BIT Development Makefile

.PHONY: help install dev build test clean docker

help: ## Show this help message
	@echo "OR-BIT Development Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev: ## Start development servers
	@echo "Starting OR-BIT development environment..."
	@make -j2 dev-backend dev-frontend

dev-backend: ## Start backend development server
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

build: ## Build production versions
	@echo "Building backend..."
	cd backend && python -m build
	@echo "Building frontend..."
	cd frontend && npm run build

test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && source venv/bin/activate && pytest
	@echo "Running frontend tests..."
	cd frontend && npm test

docker: ## Build and start Docker containers
	docker-compose up --build

docker-prod: ## Start production Docker containers
	docker-compose -f docker-compose.prod.yml up -d

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf __pycache__ .pytest_cache build dist *.egg-info
	cd frontend && rm -rf .next node_modules/.cache

lint: ## Run linting
	cd backend && source venv/bin/activate && black . && isort . && flake8
	cd frontend && npm run lint

format: ## Format code
	cd backend && source venv/bin/activate && black . && isort .
	cd frontend && npm run lint -- --fix

setup-env: ## Create environment files from templates
	cp backend/.env.example backend/.env
	cp frontend/.env.local.example frontend/.env.local
	@echo "Environment files created. Please edit them with your configuration."

backup: ## Backup data and models
	@echo "Creating backup..."
	tar -czf orbit-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz backend/data backend/models

restore: ## Restore from backup (usage: make restore BACKUP=filename.tar.gz)
	@echo "Restoring from $(BACKUP)..."
	tar -xzf $(BACKUP)

logs: ## Show application logs
	docker-compose logs -f orbit-backend orbit-frontend

monitor: ## Start monitoring dashboard
	@echo "Starting monitoring dashboard..."
	docker-compose up -d prometheus grafana

deploy: ## Deploy to production
	@echo "Deploying OR-BIT to production..."
	@echo "Make sure you have configured production environment variables!"
	docker-compose -f docker-compose.prod.yml up -d --build
"""

print("Backend configuration and deployment files ready!")
print("Files included:")
print("- requirements.txt")
print("- .env.example") 
print("- docker-compose.yml")
print("- Dockerfile (backend)")
print("- Dockerfile (frontend)")
print("- Makefile")