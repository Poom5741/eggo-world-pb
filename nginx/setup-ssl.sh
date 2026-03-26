#!/bin/bash
# SSL Certificate Setup Script for Nginx + PocketBase
# This script generates SSL certificates for testing
# For production, use Cloudflare Origin certificates or Let's Encrypt

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/ssl"

echo "=========================================="
echo "SSL Certificate Setup"
echo "=========================================="

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo "SSL certificates already exist in $SSL_DIR"
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing certificates."
        exit 0
    fi
fi

echo ""
echo "Select certificate type:"
echo "1) Self-signed certificates (for testing only)"
echo "2) Let's Encrypt certificates (requires domain)"
echo "3) Cloudflare Origin certificates (recommended)"
echo ""

read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Generating self-signed certificates..."
        read -p "Enter your domain name (or use localhost): " domain
        domain=${domain:-localhost}

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/privkey.pem" \
            -out "$SSL_DIR/fullchain.pem" \
            -subj "/CN=$domain" \
            -addext "subjectAltName=DNS:$domain,DNS:localhost,IP:127.0.0.1"

        echo ""
        echo "✓ Self-signed certificates generated:"
        echo "  - Private key: $SSL_DIR/privkey.pem"
        echo "  - Certificate: $SSL_DIR/fullchain.pem"
        echo ""
        echo "WARNING: Self-signed certificates will show security warnings in browsers."
        echo "Use Cloudflare Origin certificates or Let's Encrypt for production."
        ;;

    2)
        echo ""
        echo "Let's Encrypt setup requires:"
        echo "  - A publicly accessible domain"
        echo "  - Port 80 available for ACME challenge"
        echo ""
        read -p "Enter your domain name: " domain

        if [ -z "$domain" ]; then
            echo "Error: Domain name is required"
            exit 1
        fi

        echo ""
        echo "Starting certbot for $domain..."
        echo "Make sure nginx is running first: docker compose up -d nginx"
        echo ""

        docker run -it --rm \
            -v "$SSL_DIR:/etc/letsencrypt" \
            -v "$SCRIPT_DIR/www:/var/www/certbot" \
            -p 80:80 \
            certbot/certbot certonly --standalone \
            --preferred-challenges http \
            --email admin@$domain \
            --agree-tos --no-eff-tos \
            -d $domain

        # Create symlinks for nginx
        ln -sf "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/fullchain.pem" 2>/dev/null || true
        ln -sf "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/privkey.pem" 2>/dev/null || true

        echo ""
        echo "✓ Let's Encrypt certificates obtained for $domain"
        echo "  Certificates will auto-renew via certbot container"
        ;;

    3)
        echo ""
        echo "Cloudflare Origin Certificates setup:"
        echo ""
        echo "1. Go to Cloudflare Dashboard → SSL/TLS → Origin Server"
        echo "2. Click 'Create Certificate'"
        echo "3. Choose 'Let Cloudflare generate a private key and CSR'"
        echo "4. Select validity period (15 years recommended)"
        echo "5. Copy the certificate to: $SSL_DIR/fullchain.pem"
        echo "6. Copy the private key to: $SSL_DIR/privkey.pem"
        echo ""
        read -p "Press Enter when you've copied the certificates..."

        if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
            echo "Error: Certificate files not found!"
            echo "Expected files:"
            echo "  - $SSL_DIR/fullchain.pem"
            echo "  - $SSL_DIR/privkey.pem"
            exit 1
        fi

        echo ""
        echo "✓ Cloudflare Origin certificates configured"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Set proper permissions
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"

echo ""
echo "=========================================="
echo "Verifying certificates..."
echo "=========================================="

# Verify certificate
openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -subject -dates

echo ""
echo "=========================================="
echo "SSL Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update nginx/conf.d/pocketbase.conf with your domain:"
echo "   server_name your-domain.com;"
echo ""
echo "2. Start the services:"
echo "   cd /root/eggo-world-pb/eggo-pb && docker compose up -d"
echo "   cd /root/eggo-world-pb/nginx && docker compose up -d"
echo ""
echo "3. Configure Cloudflare DNS to point to your server IP"
echo ""
echo "4. Test with: curl -k https://localhost/api/health"
echo ""
