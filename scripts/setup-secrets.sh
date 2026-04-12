#!/bin/bash
# Interactive secrets setup script for Eggo PocketBase production deployment
# This script helps you generate and validate all required production secrets

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.production"
ENV_EXAMPLE=".env.production.example"
MIN_MASTER_KEY_LENGTH=32

# Required variables (cannot be empty)
REQUIRED_VARS=(
    "LINE_CHANNEL_ID"
    "LINE_CHANNEL_SECRET"
    "WALLET_MASTER_KEY"
    "DACC_MNEMONIC"
    "POCKETBASE_ADMIN_EMAIL"
    "POCKETBASE_ADMIN_PASSWORD"
)

# Optional but recommended variables
RECOMMENDED_VARS=(
    "CORS_ORIGIN"
    "BSC_MAINNET_RPC"
    "DEPLOYER_PRIVATE_KEY"
)

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}→ $1${NC}"
}

check_openssl() {
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is required but not installed"
        print_info "Install OpenSSL: brew install openssl (macOS) or apt-get install openssl (Linux)"
        exit 1
    fi
    print_success "OpenSSL is available"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env.production file not found"
        print_info "Creating from .env.production.example..."
        if [ ! -f "$ENV_EXAMPLE" ]; then
            print_error ".env.production.example not found"
            exit 1
        fi
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        print_success "Created .env.production from template"
    else
        print_success ".env.production file exists"
    fi
}

generate_wallet_master_key() {
    print_header "Generating WALLET_MASTER_KEY"

    local current_key=$(grep "^WALLET_MASTER_KEY=" "$ENV_FILE" | cut -d'=' -f2-)

    if [[ "$current_key" == *"generate"* ]] || [[ ${#current_key} -lt $MIN_MASTER_KEY_LENGTH ]]; then
        print_warning "WALLET_MASTER_KEY is not set or too short"
        print_info "Generating secure 256-bit key..."

        local new_key=$(openssl rand -hex 32)

        print_info "New key generated: ${new_key:0:16}..."
        print_warning "IMPORTANT: This key encrypts ALL user private keys"
        print_warning "If lost, ALL user wallets become PERMANENTLY UNRECOVERABLE"
        print_info ""

        read -p "Replace WALLET_MASTER_KEY in .env.production? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i.tmp "s/^WALLET_MASTER_KEY=.*/WALLET_MASTER_KEY=$new_key/" "$ENV_FILE"
            rm -f "${ENV_FILE}.tmp"
            print_success "WALLET_MASTER_KEY updated"
            print_info "Please back up this key in a secure password manager!"
        else
            print_info "Skipping WALLET_MASTER_KEY generation"
        fi
    else
        print_success "WALLET_MASTER_KEY is set (${#current_key} chars)"
    fi
}

validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

validate_mnemonic() {
    local mnemonic="$1"
    local word_count=$(echo "$mnemonic" | wc -w)
    [[ $word_count -ge 12 ]] && [[ $word_count -le 24 ]]
}

validate_required_vars() {
    print_header "Validating Required Variables"

    local missing_vars=()
    local invalid_vars=()

    for var in "${REQUIRED_VARS[@]}"; do
        local value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2-)

        if [[ -z "$value" ]] || [[ "$value" == *"your-"* ]] || [[ "$value" == *"generate"* ]]; then
            missing_vars+=("$var")
            print_error "$var: Not set or still using placeholder"
        else
            # Validate specific formats
            case "$var" in
                "POCKETBASE_ADMIN_EMAIL")
                    if ! validate_email "$value"; then
                        invalid_vars+=("$var (invalid email format)")
                        print_error "$var: Invalid email format"
                    else
                        print_success "$var: Valid"
                    fi
                    ;;
                "WALLET_MASTER_KEY")
                    if [[ ${#value} -lt $MIN_MASTER_KEY_LENGTH ]]; then
                        invalid_vars+=("$var (too short, min $MIN_MASTER_KEY_LENGTH chars)")
                        print_error "$var: Too short (min $MIN_MASTER_KEY_LENGTH chars)"
                    else
                        print_success "$var: Valid (${#value} chars)"
                    fi
                    ;;
                "DACC_MNEMONIC")
                    if ! validate_mnemonic "$value"; then
                        invalid_vars+=("$var (should be 12-24 words)")
                        print_error "$var: Should be 12-24 words"
                    else
                        print_success "$var: Valid"
                    fi
                    ;;
                *)
                    print_success "$var: Set"
                    ;;
            esac
        fi
    done

    # Check recommended vars
    if [ ${#RECOMMENDED_VARS[@]} -gt 0 ]; then
        echo ""
        print_info "Recommended variables:"
        for var in "${RECOMMENDED_VARS[@]}"; do
            local value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2-)
            if [[ -z "$value" ]] || [[ "$value" == *"your-"* ]]; then
                print_warning "$var: Not set (recommended)"
            else
                print_success "$var: Set"
            fi
        done
    fi

    echo ""

    if [ ${#missing_vars[@]} -gt 0 ] || [ ${#invalid_vars[@]} -gt 0 ]; then
        print_error "Validation failed!"
        if [ ${#missing_vars[@]} -gt 0 ]; then
            print_info "Missing variables: ${missing_vars[*]}"
        fi
        if [ ${#invalid_vars[@]} -gt 0 ]; then
            print_info "Invalid variables: ${invalid_vars[*]}"
        fi
        return 1
    else
        print_success "All required variables are valid!"
        return 0
    fi
}

show_github_secrets() {
    print_header "GitHub Secrets Setup Commands"

    print_info "Add these secrets to your GitHub repository:"
    print_info "Navigate to: Settings → Secrets and variables → Actions"
    echo ""

    while IFS= read -r line; do
        if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
            continue
        fi

        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            local var_name="${BASH_REMATCH[1]}"
            local var_value="${BASH_REMATCH[2]}"

            if [[ "$var_value" =~ (your-|generate) ]]; then
                continue
            fi

            echo "gh secret set $var_name --body '$var_value'"
        fi
    done < "$ENV_FILE"

    echo ""
    print_warning "Run these commands in your repository directory"
    print_warning "Make sure you have gh CLI installed and authenticated"
}

show_rotation_instructions() {
    print_header "Secrets Rotation Procedure"

    cat << 'EOF'
1. WALLET_MASTER_KEY Rotation (CRITICAL):
   ⚠️  WARNING: Requires database migration to re-encrypt all private keys
   - Generate new key: openssl rand -hex 32
   - Back up old key securely
   - Create migration script to decrypt with old key, encrypt with new
   - Update .env.production and deploy
   - Verify all wallets still work
   - Archive old key (DO NOT delete until verified)

2. LINE Credentials Rotation:
   - Generate new credentials in LINE Developers Console
   - Update LINE_CHANNEL_ID and LINE_CHANNEL_SECRET
   - Deploy to production
   - Remove old credentials from LINE Console

3. Admin Credentials Rotation:
   - Change POCKETBASE_ADMIN_PASSWORD in PocketBase Admin UI
   - Update .env.production
   - Deploy to production
   - Test admin login

4. DACC_MNEMONIC Rotation:
   ⚠️  WARNING: This will change the DACC wallet address
   - Generate new mnemonic phrase
   - Update DACC_MNEMONIC in .env.production
   - Deploy to production
   - Update all contracts and references to new address

Recommended Rotation Schedule:
- WALLET_MASTER_KEY: Annually (with full backup verification)
- LINE Credentials: Bi-annually
- Admin Credentials: Quarterly
- DACC_MNEMONIC: Only if compromised (major migration required)

EOF
}

show_security_checklist() {
    print_header "Security Checklist"

    cat << 'EOF'
Before deploying to production, ensure:

☐ WALLET_MASTER_KEY is backed up in a secure password manager
☐ DACC_MNEMONIC is backed up in a secure password manager
☐ All secrets are stored in GitHub Secrets (not in code)
☐ .env.production is in .gitignore
☐ .env.production has correct production URLs (not localhost)
☐ POCKETBASE_ADMIN_PASSWORD is strong (16+ chars, mixed case)
☐ LINE Console has production callback URL
☐ CORS_ORIGIN allows only production domains
☐ RPC endpoints are from reputable providers or self-hosted
☐ DEPLOYER_PRIVATE_KEY is a dedicated deployer wallet
☐ 2FA is enabled on all developer accounts
☐ Access logs are being monitored
☐ Database backups are automated and encrypted
☐ Secrets rotation schedule is documented

EOF
}

main() {
    print_header "Eggo PocketBase - Production Secrets Setup"

    # Parse command line arguments
    case "${1:-}" in
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --help, -h       Show this help message"
            echo "  --validate       Only validate existing .env.production"
            echo "  --github         Show GitHub secrets setup commands"
            echo "  --rotate         Show secrets rotation procedure"
            echo "  --checklist      Show security checklist"
            echo ""
            echo "Default behavior:"
            echo "  Check OpenSSL, create .env.production if needed, generate WALLET_MASTER_KEY, validate all variables"
            exit 0
            ;;
        --validate)
            check_env_file
            validate_required_vars
            exit $?
            ;;
        --github)
            show_github_secrets
            exit 0
            ;;
        --rotate)
            show_rotation_instructions
            exit 0
            ;;
        --checklist)
            show_security_checklist
            exit 0
            ;;
    esac

    # Main workflow
    check_openssl
    echo ""
    check_env_file
    echo ""
    generate_wallet_master_key
    echo ""

    if validate_required_vars; then
        echo ""
        print_success "Setup complete! Your .env.production is ready for deployment."
        echo ""
        print_info "Next steps:"
        print_info "1. Review and backup all secrets in a password manager"
        print_info "2. Add secrets to GitHub: $0 --github"
        print_info "3. Review security checklist: $0 --checklist"
        print_info "4. Deploy to production"
        exit 0
    else
        echo ""
        print_error "Setup incomplete. Please fix the issues above and run again."
        exit 1
    fi
}

main "$@"