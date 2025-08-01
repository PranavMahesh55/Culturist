# Culturis Deployment Guide

## Overview
This guide covers deploying the Culturis application in different environments, from local development to production deployment.

## Prerequisites

### System Requirements
- **Node.js**: v16.0 or higher
- **Python**: v3.8 or higher
- **MongoDB**: v4.4 or higher (or MongoDB Atlas)
- **Git**: Latest version

### Required API Keys
- **Qloo API Key**: Cultural venue data access
- **OpenAI API Key**: AI chat and processing
- **MongoDB Connection String**: Database access

## Local Development Setup

### 1. Environment Setup

#### Clone Repository
```bash
git clone <repository-url>
cd Qloo
```

#### Backend Setup
```bash
cd backend

# Create virtual environment (recommended)
python -m venv culturis_env
source culturis_env/bin/activate  # On Windows: culturis_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

#### Frontend Setup
```bash
cd culturis-studio

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

#### Backend (.env)
```bash
# API Keys
QLOO_API_KEY=your_qloo_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/culturis
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/culturis

# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# CORS Settings (development)
ALLOWED_ORIGINS=["http://localhost:3000"]
```

#### Frontend (.env)
```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_ANALYTICS=false
```

### 3. Running the Application

#### Start Backend
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Frontend
```bash
cd culturis-studio
npm start
```

#### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Production Deployment

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - QLOO_API_KEY=${QLOO_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
    depends_on:
      - mongodb

  frontend:
    build: ./culturis-studio
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

### Cloud Deployment Options

#### Option 1: Heroku

##### Backend (Heroku)
```bash
# Install Heroku CLI
# Create Heroku app
heroku create culturis-backend

# Set environment variables
heroku config:set QLOO_API_KEY=your_key -a culturis-backend
heroku config:set OPENAI_API_KEY=your_key -a culturis-backend
heroku config:set MONGODB_URI=your_uri -a culturis-backend

# Deploy
git subtree push --prefix=backend heroku main
```

##### Frontend (Netlify/Vercel)
```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build

# Or deploy to Vercel
vercel --prod
```

#### Option 2: AWS

##### Backend (AWS ECS/Fargate)
```yaml
# task-definition.json
{
  "family": "culturis-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/culturis-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "QLOO_API_KEY",
          "value": "your_key"
        }
      ]
    }
  ]
}
```

##### Frontend (AWS S3 + CloudFront)
```bash
# Build application
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Option 3: Google Cloud Platform

##### Backend (Cloud Run)
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/culturis-backend', './backend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/culturis-backend']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'culturis-backend', '--image', 'gcr.io/$PROJECT_ID/culturis-backend', '--platform', 'managed', '--region', 'us-central1']
```

### Database Setup

#### MongoDB Atlas (Recommended)
1. Create MongoDB Atlas account
2. Create new cluster
3. Configure network access
4. Create database user
5. Get connection string
6. Update `MONGODB_URI` in environment

#### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use culturis
> db.createUser({
  user: "culturis_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## Environment-Specific Configurations

### Development
```bash
# Backend
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
ALLOWED_ORIGINS=["http://localhost:3000"]

# Frontend
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_DEBUG=true
```

### Staging
```bash
# Backend
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["https://staging.culturis.com"]

# Frontend
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_BASE_URL=https://api-staging.culturis.com
REACT_APP_ENABLE_DEBUG=false
```

### Production
```bash
# Backend
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
ALLOWED_ORIGINS=["https://culturis.com"]

# Frontend
REACT_APP_ENVIRONMENT=production
REACT_APP_API_BASE_URL=https://api.culturis.com
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_ANALYTICS=true
```

## SSL/HTTPS Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name culturis.com www.culturis.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name culturis.com www.culturis.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        root /var/www/culturis;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Logging

### Application Monitoring
```python
# Add to main.py
import logging
from fastapi import Request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logging.info(
        f"Path: {request.url.path} | "
        f"Method: {request.method} | "
        f"Status: {response.status_code} | "
        f"Time: {process_time:.4f}s"
    )
    
    return response
```

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "dependencies": {
            "mongodb": await check_mongodb_connection(),
            "qloo_api": await check_qloo_api(),
            "openai_api": await check_openai_api()
        }
    }
```

## Performance Optimization

### Backend Optimizations
```python
# Add connection pooling
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(
    mongodb_uri,
    maxPoolSize=10,
    minPoolSize=1,
    maxIdleTimeMS=30000
)

# Add caching
from functools import lru_cache

@lru_cache(maxsize=100)
def get_venue_recommendations(tastes: str, location: str):
    # Cached venue recommendations
    pass
```

### Frontend Optimizations
```javascript
// Code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Image optimization
const OptimizedImage = ({ src, alt }) => (
  <img 
    src={src} 
    alt={alt} 
    loading="lazy"
    style={{ objectFit: 'cover' }}
  />
);
```

## Security Considerations

### Backend Security
- Input validation with Pydantic
- CORS configuration
- Rate limiting
- API key validation
- SQL injection prevention

### Frontend Security
- Content Security Policy (CSP)
- HTTPS enforcement
- Secure cookie handling
- XSS prevention

## Backup and Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/culturis" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### Application Recovery
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/culturis" /backup/20250801/culturis

# Rolling deployment
docker-compose up -d --scale backend=2
docker-compose stop backend_old
```

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check dependencies
pip list

# Check environment variables
echo $QLOO_API_KEY

# Check logs
tail -f app.log
```

#### Frontend Build Fails
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules
npm install

# Check environment variables
echo $REACT_APP_API_BASE_URL
```

#### Database Connection Issues
```bash
# Test MongoDB connection
mongo "mongodb://localhost:27017/culturis"

# Check network connectivity
telnet mongodb-host 27017

# Verify credentials
mongo --eval "db.adminCommand('ismaster')"
```

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies monthly
- Monitor API usage and costs
- Review and rotate API keys
- Check application logs
- Performance monitoring
- Security audits

### Scaling Considerations
- Horizontal scaling with load balancers
- Database read replicas
- CDN for static assets
- Caching layers (Redis)
- Microservices architecture migration

This deployment guide provides comprehensive instructions for deploying Culturis in various environments. Choose the deployment option that best fits your infrastructure needs and technical requirements.
