# V-Try.app Docker Infrastructure

This directory contains the Docker infrastructure for the V-Try.app development environment.

## 🚀 Quick Start

1. **Copy environment variables:**
   ```bash
   cp env.example .env
   ```

2. **Edit the .env file with your actual values:**
   - Add your KIE AI API key
   - Add your AWS credentials
   - Other optional configurations

3. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

4. **Check service health:**
   ```bash
   docker-compose ps
   ```

## 📋 Services

### Core Services
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache and queue (port 6379)
- **api**: Fastify API server (port 3001)
- **worker**: Background job processor
- **website**: Next.js website (port 3000)

### Development Tools
- **nginx**: Reverse proxy (port 80)
- **pgadmin**: PostgreSQL GUI (port 8080)
- **redis-commander**: Redis GUI (port 8081)

### Monitoring
- **prometheus**: Metrics collection (port 9090)
- **grafana**: Monitoring dashboards (port 3030)

## 🔧 Management Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

### Rebuild services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build api
```

### Database operations
```bash
# Run Prisma migrations
docker-compose exec api npx prisma migrate dev

# Generate Prisma client
docker-compose exec api npx prisma generate

# Seed database
docker-compose exec api npx prisma db seed
```

### Scale services
```bash
# Scale worker instances
docker-compose up -d --scale worker=3
```

## 🌐 Access URLs

### Main Services
- **Website**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

### Development Tools
- **pgAdmin**: http://localhost:8080
  - Email: admin@vtry.app
  - Password: admin
- **Redis Commander**: http://localhost:8081
  - User: admin
  - Password: admin

### Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3030
  - User: admin
  - Password: admin

## 📁 Directory Structure

```
infrastructure/docker/
├── docker-compose.yml          # Main Docker Compose configuration
├── Dockerfile.api              # API server Dockerfile
├── Dockerfile.worker           # Background worker Dockerfile
├── Dockerfile.website          # Website Dockerfile
├── env.example                 # Environment variables template
├── nginx/
│   └── nginx.conf             # Nginx reverse proxy configuration
├── postgres/
│   └── init.sql               # PostgreSQL initialization script
├── prometheus/
│   └── prometheus.yml         # Prometheus configuration
└── README.md                  # This file
```

## 🔒 Environment Variables

Required environment variables (copy from `env.example`):

- `KIE_AI_API_KEY`: Your KIE AI API key
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_S3_BUCKET`: S3 bucket name for file storage
- `AWS_REGION`: AWS region (default: us-east-1)

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 3001, 5432, 6379, 8080, 8081, 9090, 3030 are not in use
2. **Permission issues**: Make sure Docker has permission to bind to ports
3. **Memory issues**: Increase Docker memory allocation if services fail to start

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Execute commands in containers
docker-compose exec api bash
docker-compose exec postgres psql -U vtry_user -d vtry_app

# Check resource usage
docker stats
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove all images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## 📊 Monitoring

### Metrics
- API performance metrics available at `/metrics` endpoint
- Prometheus collects metrics every 15 seconds
- Grafana provides visual dashboards

### Health Checks
- API: `GET /health`
- Website: `GET /api/health`
- Database: Automatic health checks in Docker Compose

## 🚀 Production Considerations

This setup is optimized for development. For production:

1. **Security**: Change all default passwords and secrets
2. **SSL/TLS**: Add SSL certificates and configure HTTPS
3. **Environment**: Use production environment variables
4. **Scaling**: Use Docker Swarm or Kubernetes for orchestration
5. **Monitoring**: Add alerting and log aggregation
6. **Backups**: Implement database and file backups
7. **Secrets**: Use Docker secrets or external secret management

## 📝 Notes

- The development setup uses bind mounts for hot reloading
- Production builds use multi-stage Dockerfiles for optimization
- All services use health checks for better reliability
- Nginx provides load balancing and SSL termination
- Redis is used for both caching and job queues
