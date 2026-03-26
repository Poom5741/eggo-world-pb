#!/bin/bash
# Main Setup Script for Nginx + PocketBase + Cloudflare
# This script orchestrates the entire setup process

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=========================================="
echo "  Nginx + PocketBase + Cloudflare Setup"
echo "=========================================="
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Create Docker network
create_network() {
    print_status "Creating Docker network: pocketbase_network"
    if docker network ls | grep -q "pocketbase_network"; then
        print_warning "Network 'pocketbase_network' already exists"
    else
        docker network create pocketbase_network
        print_success "Docker network created"
    fi
}

# Start PocketBase
start_pocketbase() {
    print_status "Starting PocketBase..."
    cd "$SCRIPT_DIR/eggo-pb"

    # Check if already running
    if docker ps | grep -q "eggo-pb"; then
        print_warning "PocketBase container is already running"
    else
        docker compose up -d
        print_success "PocketBase container started"
    fi

    # Wait for PocketBase to be healthy
    print_status "Waiting for PocketBase to be healthy..."
    for i in {1..30}; do
        if docker ps | grep eggo-pb | grep -q "healthy"; then
            print_success "PocketBase is healthy"
            return 0
        fi
        sleep 1
    done

    print_error "PocketBase failed to become healthy within 30 seconds"
    docker compose logs --tail=20
    exit 1
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    cd "$SCRIPT_DIR/nginx"

    # Check if certificates exist
    if [ -f "$SCRIPT_DIR/nginx/ssl/fullchain.pem" ] && [ -f "$SCRIPT_DIR/nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates already exist"
        read -p "Do you want to regenerate them? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_success "Using existing SSL certificates"
            return 0
        fi
    fi

    echo ""
    echo "Select SSL certificate type:"
    echo "1) Self-signed certificates (for local testing)"
    echo "2) Generate self-signed now and configure Cloudflare later"
    echo ""
    read -p "Enter choice [1-2]: " ssl_choice

    case $ssl_choice in
        1|2)
            print_status "Generating self-signed certificates..."
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$SCRIPT_DIR/nginx/ssl/privkey.pem" \
                -out "$SCRIPT_DIR/nginx/ssl/fullchain.pem" \
                -subj "/CN=localhost" \
                -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
            chmod 600 "$SCRIPT_DIR/nginx/ssl/privkey.pem"
            chmod 644 "$SCRIPT_DIR/nginx/ssl/fullchain.pem"
            print_success "Self-signed SSL certificates generated"
            print_warning "These certificates are for testing only!"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Start Nginx
start_nginx() {
    print_status "Starting Nginx..."
    cd "$SCRIPT_DIR/nginx"

    # Check if already running
    if docker ps | grep -q "eggo-nginx"; then
        print_warning "Nginx container is already running"
        docker compose restart nginx
        print_success "Nginx container restarted"
    else
        docker compose up -d
        print_success "Nginx container started"
    fi

    # Wait for nginx to be ready
    sleep 2

    # Test nginx
    if curl -s -k -o /dev/null -w "%{http_code}" https://localhost:443/api/health | grep -q "200\|301\|302"; then
        print_success "Nginx is responding"
    else
        print_warning "Nginx health check returned non-200, checking logs..."
        docker compose logs --tail=20 nginx
    fi
}

# Show status
show_status() {
    echo ""
    echo -e "${BLUE}=========================================="
    echo "  Current Status"
    echo "==========================================${NC}"
    echo ""

    echo "Docker Containers:"
    docker ps --filter "name=eggo" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
    echo ""

    echo "Docker Networks:"
    docker network ls | grep pocketbase || true
    echo ""

    echo "Test Commands:"
    echo "  HTTP Test:  curl http://localhost/api/health"
    echo "  HTTPS Test: curl -k https://localhost/api/health"
    echo ""
}

# Update domain in nginx config
update_domain() {
    echo ""
    read -p "Do you want to update the domain in nginx config now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain (e.g., api.yourdomain.com): " domain
        if [ -n "$domain" ]; then
            sed -i "s/server_name _;/server_name $domain;/g" "$SCRIPT_DIR/nginx/conf.d/pocketbase.conf"
            print_success "Updated nginx config with domain: $domain"
            print_status "Restarting nginx..."
            cd "$SCRIPT_DIR/nginx" && docker compose restart nginx
        fi
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}=========================================="
    echo "  Setup Menu"
    echo "==========================================${NC}"
    echo ""
    echo "1) Full Setup (Network + PocketBase + SSL + Nginx)"
    echo "2) Start PocketBase only"
    echo "3) Start Nginx only"
    echo "4) Stop all services"
    echo "5) Restart all services"
    echo "6) View logs"
    echo "7) Update domain configuration"
    echo "8) Show status"
    echo "9) Setup Cloudflare SSL certificates"
    echo "0) Exit"
    echo ""
}

# Full setup
full_setup() {
    print_status "Starting full setup..."
    check_docker
    create_network
    start_pocketbase
    setup_ssl
    start_nginx
    show_status
    update_domain

    echo ""
    echo -e "${GREEN}=========================================="
    echo "  Setup Complete!"
    echo "==========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Configure your domain DNS to point to this server"
    echo "  2. Update Cloudflare SSL settings (see plans/nginx-pocketbase-cloudflare-plan.md)"
    echo "  3. Replace self-signed certificates with Cloudflare Origin certificates"
    echo ""
    echo "Access Points:"
    echo "  - API:      https://your-domain/api/health"
    echo "  - Admin:    https://your-domain/_/"
    echo ""
}

# Stop all services
stop_all() {
    print_status "Stopping all services..."
    cd "$SCRIPT_DIR/eggo-pb" && docker compose down 2>/dev/null || true
    cd "$SCRIPT_DIR/nginx" && docker compose down 2>/dev/null || true
    print_success "All services stopped"
}

# Restart all services
restart_all() {
    stop_all
    start_pocketbase
    start_nginx
    show_status
}

# View logs
view_logs() {
    echo ""
    echo "Select service:"
    echo "1) PocketBase"
    echo "2) Nginx"
    echo "3) Both"
    read -p "Enter choice [1-3]: " log_choice

    case $log_choice in
        1)
            cd "$SCRIPT_DIR/eggo-pb" && docker compose logs -f
            ;;
        2)
            cd "$SCRIPT_DIR/nginx" && docker compose logs -f
            ;;
        3)
            echo "Showing logs for both services (Ctrl+C to exit)..."
            (cd "$SCRIPT_DIR/eggo-pb" && docker compose logs -f &) 2>/dev/null
            (cd "$SCRIPT_DIR/nginx" && docker compose logs -f) 2>/dev/null
            ;;
    esac
}

# Setup Cloudflare certificates
setup_cloudflare_ssl() {
    print_status "Cloudflare Origin Certificate Setup"
    echo ""
    echo "Instructions:"
    echo "1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server"
    echo "2. Click 'Create Certificate'"
    echo "3. Copy the certificate content to a file"
    echo "4. Copy the private key content to a file"
    echo ""
    read -p "Press Enter to continue..."

    SSL_DIR="$SCRIPT_DIR/nginx/ssl"
    echo ""
    echo "Paste the certificate content (end with Ctrl+D):"
    cat > "$SSL_DIR/fullchain.pem"

    echo ""
    echo "Paste the private key content (end with Ctrl+D):"
    cat > "$SSL_DIR/privkey.pem"

    chmod 600 "$SSL_DIR/privkey.pem"
    chmod 644 "$SSL_DIR/fullchain.pem"

    print_success "Cloudflare certificates installed"
    print_status "Restarting nginx..."
    cd "$SCRIPT_DIR/nginx" && docker compose restart nginx
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice [0-9]: " choice

    case $choice in
        1) full_setup ;;
        2) start_pocketbase; show_status ;;
        3) setup_ssl; start_nginx; show_status ;;
        4) stop_all ;;
        5) restart_all ;;
        6) view_logs ;;
        7) update_domain ;;
        8) show_status ;;
        9) setup_cloudflare_ssl ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) print_error "Invalid choice" ;;
    esac
done
