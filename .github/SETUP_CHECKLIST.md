# GitHub Actions CI/CD Setup Checklist

Complete this checklist to fully set up GitHub Actions for your project.

## Pre-Setup

- [ ] GitHub repository created and code pushed
- [ ] GitHub CLI installed (optional, for automation)
- [ ] SSH key pair generated for deployment
- [ ] Production/Staging servers ready with Docker installed

## Step 1: Configure Secrets

### Production Deployment
- [ ] Add `PRODUCTION_HOST` secret
- [ ] Add `PRODUCTION_USER` secret  
- [ ] Add `PRODUCTION_SSH_KEY` secret (private key content)
- [ ] Add `PRODUCTION_SSH_PORT` secret (usually 22)
- [ ] Add `PRODUCTION_DEPLOY_PATH` secret (e.g., /home/deploy/app)

### Staging Deployment (Optional)
- [ ] Add `STAGING_HOST` secret
- [ ] Add `STAGING_USER` secret
- [ ] Add `STAGING_SSH_KEY` secret
- [ ] Add `STAGING_SSH_PORT` secret
- [ ] Add `STAGING_DEPLOY_PATH` secret

### Optional Services
- [ ] Add `SONARCLOUD_TOKEN` (for code quality analysis)
- [ ] Add `SLACK_WEBHOOK` (for deployment notifications)

## Step 2: Configure Repository

### Branch Protection
- [ ] Go to Settings → Branches
- [ ] Add rule for `main` branch
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass (select all CI workflows)
- [ ] Include administrators in restrictions

### Environment Configuration
- [ ] Create `.env.prod` from `.env.example`
- [ ] Fill in all required values
- [ ] **DO NOT commit .env.prod to git**
- [ ] Add `.env` and `.env.prod` to `.gitignore`

### GitHub Variables (Optional)
- [ ] Set `ENABLE_SONARCLOUD=true` if using SonarCloud
- [ ] Set any other organization-wide variables

## Step 3: Setup Production Server

### SSH Access
- [ ] SSH key copied to server (`ssh-copy-id`)
- [ ] SSH user configured for password-less auth
- [ ] SSH port configured (if not 22)

### Docker Setup
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Docker daemon configured to start on boot
- [ ] Sufficient disk space for images (minimum 10GB recommended)

### Application Directory
- [ ] Directory created at `PRODUCTION_DEPLOY_PATH`
- [ ] Permissions set correctly for deploy user
- [ ] `.env` file created with production values

### Database & Redis
- [ ] PostgreSQL database created and accessible
- [ ] Redis instance running and accessible
- [ ] Backups configured (optional)
- [ ] Monitoring setup (optional)

## Step 4: Test Workflows

### CI Workflow
- [ ] Push to `develop` branch
- [ ] Verify CI workflow runs
- [ ] Verify all tests pass
- [ ] Check code coverage reports

### Build Workflow
- [ ] Wait for build workflow to complete
- [ ] Verify Docker images pushed to GitHub Container Registry
- [ ] Check image tags and versions

### Manual Deployment
- [ ] Go to Actions → Deploy to Production
- [ ] Click "Run workflow"
- [ ] Select "staging" environment
- [ ] Verify deployment completes successfully
- [ ] Test application on staging server

### Production Deployment
- [ ] Push a test tag: `git tag v0.0.1 && git push origin v0.0.1`
- [ ] Verify release created on GitHub
- [ ] Manually trigger production deployment
- [ ] Monitor deployment logs
- [ ] Test application on production

## Step 5: Configure Monitoring & Notifications

### Slack Notifications (Optional)
- [ ] Create Slack webhook URL
- [ ] Add `SLACK_WEBHOOK` secret
- [ ] Test notification by triggering a deployment

### Email Notifications
- [ ] Enable GitHub email notifications for Actions
- [ ] Configure notification preferences

### Logs & Artifacts
- [ ] Configure log retention in repository settings
- [ ] Review workflow artifacts setup
- [ ] Set up log aggregation (optional)

## Step 6: Documentation & Team Training

- [ ] Copy `.github/GITHUB_ACTIONS_SETUP.md` to project wiki or README
- [ ] Share `.github/SECRETS_CONFIGURATION.md` with team
- [ ] Document deployment process for team
- [ ] Create runbooks for common troubleshooting
- [ ] Train team on manual deployment procedures

## Step 7: Ongoing Maintenance

### Weekly
- [ ] Monitor workflow runs in Actions tab
- [ ] Check for any failed deployments
- [ ] Review error logs

### Monthly
- [ ] Update dependencies in `requirements.txt` and `package.json`
- [ ] Review and update secrets rotation schedule
- [ ] Analyze code coverage trends

### Quarterly
- [ ] Rotate SSH keys
- [ ] Review and update security policies
- [ ] Audit GitHub Actions permissions
- [ ] Performance optimization review

## Troubleshooting

### CI Tests Failing
- [ ] Check if tests pass locally
- [ ] Verify database connection in CI environment
- [ ] Check Python/Node version compatibility
- [ ] Review recent code changes

### Deployment Failing
- [ ] Verify SSH connectivity: `ssh -i key deploy@host`
- [ ] Check deployment path exists and has correct permissions
- [ ] Review `.env` configuration on server
- [ ] Check available disk space: `df -h`
- [ ] Verify Docker daemon running: `docker ps`

### Secrets Not Working
- [ ] Verify secret name matches exactly (case-sensitive)
- [ ] Ensure secret is added to correct repository
- [ ] Check SSH key format is correct
- [ ] Verify key permissions: `chmod 600 key`

## Quick Commands

```bash
# Test SSH connection
ssh -i deploy_key -p 22 deploy@production.example.com "echo 'Success'"

# View GitHub Actions logs locally (with act)
act -j build-backend

# Create a release tag
git tag v1.0.0
git push origin v1.0.0

# Check deployment status
gh run list --workflow=deploy.yml

# View latest deployment logs
gh run view <run-id> --log
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [GitHub CLI Documentation](https://cli.github.com/)

---

**Last Updated**: April 24, 2026
**Checklist Version**: 1.0
