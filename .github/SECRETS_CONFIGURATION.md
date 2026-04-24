# GitHub Secrets Configuration Template

## Required Secrets for GitHub Actions

### Docker Registry (Automatic - GitHub)
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### Production Deployment Secrets
- `PRODUCTION_HOST` - Production server hostname or IP address
- `PRODUCTION_USER` - SSH username for production server
- `PRODUCTION_SSH_KEY` - Private SSH key for authentication (multiline)
- `PRODUCTION_SSH_PORT` - SSH port (usually 22)
- `PRODUCTION_DEPLOY_PATH` - Path where code is deployed on production server

Example values:
```
PRODUCTION_HOST=api.yourdomain.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
... (contents of private key)
-----END RSA PRIVATE KEY-----
PRODUCTION_SSH_PORT=22
PRODUCTION_DEPLOY_PATH=/home/deploy/jojangocms3-modelform
```

### Staging Deployment Secrets (Optional)
- `STAGING_HOST` - Staging server hostname
- `STAGING_USER` - SSH username for staging
- `STAGING_SSH_KEY` - Private SSH key for staging
- `STAGING_SSH_PORT` - SSH port for staging
- `STAGING_DEPLOY_PATH` - Staging deployment path

### Code Quality (Optional)
- `SONARCLOUD_TOKEN` - SonarCloud authentication token for code analysis

### Notifications (Optional)
- `SLACK_WEBHOOK` - Slack webhook URL for deployment notifications

## How to Generate SSH Key for Deployment

1. Generate SSH key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f deploy_key -N ""
   ```

2. Copy public key to server:
   ```bash
   ssh-copy-id -i deploy_key.pub deploy@your-server.com
   ```

3. Add private key to GitHub Secrets:
   - Go to: Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `PRODUCTION_SSH_KEY`
   - Value: Copy entire contents of `deploy_key` file

## How to Add Secrets to GitHub

### Via GitHub Web Interface:
1. Go to your repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter Name and Value
6. Click **Add secret**

### Via GitHub CLI:
```bash
gh secret set PRODUCTION_HOST -b "your-server.com"
gh secret set PRODUCTION_USER -b "deploy"
gh secret set PRODUCTION_SSH_KEY < deploy_key
```

## Environment Variable Configuration

Production environment variables should be configured directly on the production server in:
- `<DEPLOY_PATH>/.env` - For deployment environment variables
- Docker environment in `docker-compose.prod.yml`

Do NOT commit sensitive data to git. Always use GitHub Secrets.

## Security Best Practices

1. **Rotate SSH Keys**: Change SSH keys every 90 days
2. **Limit Permissions**: SSH user should only have permissions for deployment directory
3. **Use Strong Passwords**: All credentials should be complex and unique
4. **Audit Logs**: Monitor GitHub Actions audit logs for unauthorized access
5. **Secret Scanning**: Enable secret scanning in repository settings
6. **Branch Protection**: Require CI checks before merging to main

## Debugging Secrets Issues

If deployment fails due to secrets:

1. Verify secret is added to correct repository (not organization)
2. Check secret name matches exactly in workflow (case-sensitive)
3. Ensure SSH key format is correct (RSA or ED25519)
4. Test SSH connection manually:
   ```bash
   ssh -i deploy_key -p 22 deploy@your-server.com "echo 'Connected'"
   ```

## Automatic Secret Rotation

Consider implementing:
- Quarterly key rotation
- Using GitHub's security advisories
- Enabling Dependabot for secret detection
