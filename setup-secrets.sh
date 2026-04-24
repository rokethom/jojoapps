#!/bin/bash
# Script to automate GitHub Actions secrets setup
# Usage: ./setup-secrets.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== GitHub Actions Secrets Setup ===${NC}\n"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) not installed${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${YELLOW}Enter production server details:${NC}\n"

read -p "Production Host (IP/hostname): " PROD_HOST
read -p "Production SSH User: " PROD_USER
read -p "Production SSH Port (default 22): " PROD_PORT
PROD_PORT=${PROD_PORT:-22}
read -p "Production Deployment Path (e.g., /home/deploy/app): " PROD_PATH
read -p "Path to production SSH private key: " PROD_KEY_PATH

# Validate SSH key file exists
if [ ! -f "$PROD_KEY_PATH" ]; then
    echo -e "${RED}Error: SSH key file not found: $PROD_KEY_PATH${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Adding production secrets...${NC}\n"

# Add production secrets
gh secret set PRODUCTION_HOST -b "$PROD_HOST"
echo -e "${GREEN}✓ PRODUCTION_HOST${NC}"

gh secret set PRODUCTION_USER -b "$PROD_USER"
echo -e "${GREEN}✓ PRODUCTION_USER${NC}"

gh secret set PRODUCTION_SSH_PORT -b "$PROD_PORT"
echo -e "${GREEN}✓ PRODUCTION_SSH_PORT${NC}"

gh secret set PRODUCTION_DEPLOY_PATH -b "$PROD_PATH"
echo -e "${GREEN}✓ PRODUCTION_DEPLOY_PATH${NC}"

gh secret set PRODUCTION_SSH_KEY < "$PROD_KEY_PATH"
echo -e "${GREEN}✓ PRODUCTION_SSH_KEY${NC}"

# Optional staging setup
read -p "\nSetup staging secrets? (y/n): " SETUP_STAGING
if [ "$SETUP_STAGING" == "y" ] || [ "$SETUP_STAGING" == "Y" ]; then
    echo -e "\n${YELLOW}Enter staging server details:${NC}\n"
    
    read -p "Staging Host: " STAGING_HOST
    read -p "Staging SSH User: " STAGING_USER
    read -p "Staging SSH Port (default 22): " STAGING_PORT
    STAGING_PORT=${STAGING_PORT:-22}
    read -p "Staging Deployment Path: " STAGING_PATH
    read -p "Path to staging SSH private key: " STAGING_KEY_PATH
    
    if [ ! -f "$STAGING_KEY_PATH" ]; then
        echo -e "${RED}Error: SSH key file not found: $STAGING_KEY_PATH${NC}"
        exit 1
    fi
    
    echo -e "\n${YELLOW}Adding staging secrets...${NC}\n"
    
    gh secret set STAGING_HOST -b "$STAGING_HOST"
    echo -e "${GREEN}✓ STAGING_HOST${NC}"
    
    gh secret set STAGING_USER -b "$STAGING_USER"
    echo -e "${GREEN}✓ STAGING_USER${NC}"
    
    gh secret set STAGING_SSH_PORT -b "$STAGING_PORT"
    echo -e "${GREEN}✓ STAGING_SSH_PORT${NC}"
    
    gh secret set STAGING_DEPLOY_PATH -b "$STAGING_PATH"
    echo -e "${GREEN}✓ STAGING_DEPLOY_PATH${NC}"
    
    gh secret set STAGING_SSH_KEY < "$STAGING_KEY_PATH"
    echo -e "${GREEN}✓ STAGING_SSH_KEY${NC}"
fi

# Optional additional services
read -p "\nAdd SonarCloud token? (y/n): " ADD_SONARCLOUD
if [ "$ADD_SONARCLOUD" == "y" ] || [ "$ADD_SONARCLOUD" == "Y" ]; then
    read -p "SonarCloud Token: " SONARCLOUD_TOKEN
    gh secret set SONARCLOUD_TOKEN -b "$SONARCLOUD_TOKEN"
    echo -e "${GREEN}✓ SONARCLOUD_TOKEN${NC}"
fi

read -p "\nAdd Slack webhook? (y/n): " ADD_SLACK
if [ "$ADD_SLACK" == "y" ] || [ "$ADD_SLACK" == "Y" ]; then
    read -p "Slack Webhook URL: " SLACK_WEBHOOK
    gh secret set SLACK_WEBHOOK -b "$SLACK_WEBHOOK"
    echo -e "${GREEN}✓ SLACK_WEBHOOK${NC}"
fi

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "${BLUE}All secrets have been added to your repository.${NC}\n"

# List added secrets
echo -e "${YELLOW}Added secrets:${NC}"
gh secret list

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Configure branch protection rules in repository settings"
echo "2. Update .env.prod with production values"
echo "3. Commit workflow files and push to repository"
echo "4. Monitor first CI run in Actions tab"
