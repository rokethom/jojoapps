#!/bin/bash

# JoJango CMS Production Deployment Script
# Usage: ./deploy.sh [build|up|down|restart|logs]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found! Please copy .env.prod to .env and configure your settings."
        exit 1
    fi
    print_status "Environment file found."
}

# Build all services
build_services() {
    print_status "Building all services..."
    docker-compose -f docker-compose.prod.yml build
    print_status "Build completed."
}

# Start all services
start_services() {
    print_status "Starting all services..."
    docker-compose -f docker-compose.prod.yml up -d
    print_status "Services started. Waiting for health checks..."
    sleep 30
    print_status "Deployment completed. Check logs with: ./deploy.sh logs"
}

# Stop all services
stop_services() {
    print_status "Stopping all services..."
    docker-compose -f docker-compose.prod.yml down
    print_status "Services stopped."
}

# Restart all services
restart_services() {
    print_status "Restarting all services..."
    docker-compose -f docker-compose.prod.yml restart
    print_status "Services restarted."
}

# Show logs
show_logs() {
    print_status "Showing logs (press Ctrl+C to exit)..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
    print_status "Migrations completed."
}

# Collect static files
collect_static() {
    print_status "Collecting static files..."
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
    print_status "Static files collected."
}

# Create superuser
create_superuser() {
    print_status "Creating Django superuser..."
    docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
}

# Full deployment
full_deploy() {
    check_env
    build_services
    start_services
    run_migrations
    collect_static
    print_status "Full deployment completed!"
    print_status "Your application should be available at:"
    print_status "  - Admin: https://yourdomain.com/admin"
    print_status "  - API: https://yourdomain.com/api"
    print_status "  - Admin Frontend: https://yourdomain.com/admin-frontend"
    print_status "  - Customer Frontend: https://yourdomain.com/customer"
    print_status "  - Driver Frontend: https://yourdomain.com/driver"
}

# Show usage
show_usage() {
    echo "JoJango CMS Production Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      Build all Docker services"
    echo "  up         Start all services"
    echo "  down       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       Show logs from all services"
    echo "  migrate    Run database migrations"
    echo "  static     Collect static files"
    echo "  superuser  Create Django superuser"
    echo "  deploy     Full deployment (build + up + migrate + static)"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Full deployment"
    echo "  $0 logs      # View logs"
    echo "  $0 down      # Stop everything"
}

# Main script logic
case "${1:-help}" in
    build)
        check_env
        build_services
        ;;
    up)
        check_env
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        check_env
        restart_services
        ;;
    logs)
        show_logs
        ;;
    migrate)
        check_env
        run_migrations
        ;;
    static)
        check_env
        collect_static
        ;;
    superuser)
        check_env
        create_superuser
        ;;
    deploy)
        full_deploy
        ;;
    help|*)
        show_usage
        ;;
esac