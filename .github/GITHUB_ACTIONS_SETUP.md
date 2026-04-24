# GitHub Actions CI/CD Setup Guide

This document outlines the CI/CD pipeline configured for the JoJango CMS project.

## Overview

The CI/CD pipeline automates testing, building, and deployment of your application. It's triggered on pushes and pull requests, with separate workflows for different stages.

## Workflows

### 1. **CI Workflow** (`ci.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Components:**
- **Backend Tests**: Runs Django tests with PostgreSQL and Redis services
  - Migrations check
  - Django test suite
  - Code coverage reporting
  - Linting (flake8)
  - Code formatting (black)
  - Import sorting (isort)

- **Frontend Tests**: Runs tests for all three frontend apps (admin, customer, driver)
  - NPM dependencies installation
  - Linting
  - Build verification
  - Test suite execution

- **Code Quality**: Optional SonarCloud integration for code quality metrics

- **Security Check**: Trivy vulnerability scanning

### 2. **Build Workflow** (`build.yml`)
Builds and pushes Docker images to GitHub Container Registry.

**Images Built:**
- Backend
- Frontend (Admin, Customer, Driver)
- Nginx reverse proxy

Uses multi-stage builds and Docker layer caching for optimal performance.

### 3. **Deploy Workflow** (`deploy.yml`)
Deploys the application to production/staging.

**Features:**
- Manual environment selection (staging/production)
- SSH-based deployment to VPS
- Automatic migrations
- Static files collection
- Docker Compose orchestration
- Deployment verification
- Optional Slack notifications

### 4. **Release Workflow** (`release.yml`)
Creates GitHub releases with automated changelogs.

**Triggered by:**
- Pushing tags like `v1.0.0`, `v1.0.0-alpha`, etc.

### 5. **Lint Workflow** (`lint.yml`)
Lints Dockerfiles, YAML configs, and Markdown files.

### 6. **Scheduled Tasks** (`schedule.yml`)
Runs daily:
- Dependency updates check
- Security scans
- Docker image cleanup

## Setup Instructions

### Step 1: Configure GitHub Secrets

Add the following secrets to your repository settings (`Settings > Secrets and variables > Actions`):

#### For Build & Deployment:
```
GITHUB_TOKEN          # Automatically available
```

#### For Production Deployment (SSH):
```
PRODUCTION_HOST           # VPS hostname or IP
PRODUCTION_USER           # SSH username
PRODUCTION_SSH_KEY        # Private SSH key (multiline)
PRODUCTION_SSH_PORT       # SSH port (default: 22)
PRODUCTION_DEPLOY_PATH    # Deployment path on server
```

#### For Staging Deployment (optional):
```
STAGING_HOST              # Staging VPS hostname
STAGING_USER              # Staging SSH username
STAGING_SSH_KEY           # Staging private SSH key
STAGING_SSH_PORT          # Staging SSH port
STAGING_DEPLOY_PATH       # Staging deployment path
```

#### Optional:
```
SONARCLOUD_TOKEN          # For code quality analysis
SLACK_WEBHOOK             # For Slack notifications
```

### Step 2: Configure Environment Variables

Create `.env.prod` file in the root directory:

```bash
cp .env.example .env.prod
```

Edit `.env.prod` with production values:
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:password@prod-db-host:5432/jojango
REDIS_URL=redis://prod-redis-host:6379/0
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
ENVIRONMENT=production
```

### Step 3: Set Up Production Server

1. **Install Docker and Docker Compose**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone repository**:
   ```bash
   git clone https://github.com/yourusername/jojangocms3-modelform.git
   cd jojangocms3-modelform
   ```

3. **Set up directory**:
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

4. **Add SSH key to server** (on local machine):
   ```bash
   ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server.com
   ```

### Step 4: Configure GitHub Variables (optional)

Add organization or repository variables (`Settings > Secrets and variables > Variables`):

```
ENABLE_SONARCLOUD    # Set to "true" to enable SonarCloud
```

## Workflow Triggers

| Workflow | Trigger | Branches |
|----------|---------|----------|
| CI | Push, PR | main, develop |
| Build | Push | main, develop |
| Deploy | Push to main, manual | main (auto), any (manual) |
| Release | Tag push | All tags |
| Lint | Push, PR | main, develop |
| Schedule | Daily 2 AM UTC | - |

## Manual Triggers

All workflows can be triggered manually from the GitHub Actions tab:

1. Go to **Actions** → Select workflow → **Run workflow**
2. Choose branch/tag and options
3. Click **Run workflow**

## Deployment Process

### Automatic Deployment (main branch)

1. Push code to `main` branch
2. CI tests run automatically
3. If tests pass, Docker images are built and pushed
4. Production deployment workflow starts automatically (requires environment approval)

### Manual Deployment

1. Go to **Actions** → **Deploy to Production**
2. Click **Run workflow**
3. Select environment (staging/production)
4. Review and approve
5. Deployment starts

## Monitoring & Debugging

### View Workflow Logs

1. Go to **Actions** tab
2. Select the workflow run
3. View step logs for debugging

### Common Issues

**Issue**: Tests failing in CI but passing locally
- Ensure `.env` file is properly configured
- Check database and Redis connection strings
- Verify Python/Node versions match

**Issue**: Deployment fails with SSH error
- Verify SSH key is correctly added to server
- Check SSH port and host configuration
- Ensure `DEPLOY_PATH` exists on server

**Issue**: Docker images not building
- Check Dockerfile syntax
- Verify file paths are correct
- Check available disk space on GitHub Actions runner

## Best Practices

1. **Branch Protection**: Enable branch protection rules requiring CI to pass before merging
2. **Status Checks**: Require all workflow checks to pass before merging PRs
3. **Secrets Rotation**: Regularly rotate SSH keys and credentials
4. **Logs Retention**: Set up log retention policies
5. **Notifications**: Enable Slack notifications for critical deployments
6. **Versioning**: Use semantic versioning for releases (v1.0.0)

## Environment Variables Configuration

### Development (.env)
```env
DEBUG=True
SECRET_KEY=development-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/jojango
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Production (.env.prod)
```env
DEBUG=False
SECRET_KEY=<strong-unique-key>
DATABASE_URL=postgresql://user:password@prod-host:5432/jojango_prod
REDIS_URL=redis://prod-host:6379/0
ALLOWED_HOSTS=yourdomain.com
ENVIRONMENT=production
```

## Rollback Procedure

If deployment fails or causes issues:

```bash
# SSH into production server
ssh deploy@your-server.com

# Navigate to deployment directory
cd /path/to/jojangocms3-modelform

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout previous-tag

# Redeploy
docker-compose -f docker-compose.prod.yml up -d
```

## Support & Troubleshooting

For issues with the CI/CD pipeline:

1. Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
2. Review workflow logs in the Actions tab
3. Test workflows locally with [act](https://github.com/nektos/act)
4. Check service health on production server

## Further Optimization

Consider implementing:
- Automated performance testing
- Load testing on staging
- Database backup before deployment
- Blue-green deployment strategy
- Canary deployments
- A/B testing setup
