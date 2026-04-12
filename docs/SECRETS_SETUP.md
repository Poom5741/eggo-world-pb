# Secrets Setup Guide - Eggo PocketBase Production

This guide explains how to securely configure and manage secrets for the Eggo PocketBase production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Setup](#step-by-step-setup)
  - [1. Generate WALLET_MASTER_KEY](#1-generate-wallet_master_key)
  - [2. Set Up LINE OAuth Credentials](#2-set-up-line-oauth-credentials)
  - [3. Generate DACC Mnemonic](#3-generate-dacc-mnemonic)
  - [4. Configure Admin Credentials](#4-configure-admin-credentials)
  - [5. Add Secrets to GitHub](#5-add-secrets-to-github)
  - [6. Verify Configuration](#6-verify-configuration)
- [GitHub Actions Integration](#github-actions-integration)
- [Secrets Rotation](#secrets-rotation)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up secrets, ensure you have:

- [ ] **OpenSSL** installed (for generating secure keys)

  ```bash
  # macOS
  brew install openssl

  # Linux
  sudo apt-get install openssl
  ```

- [ ] **GitHub CLI** installed (for adding secrets)

  ```bash
  # macOS
  brew install gh

  # Linux
  # See https://cli.github.com/
  ```

- [ ] **LINE Developers Console** account
  - Sign up at: https://developers.line.biz/

- [ ] **Secure password manager** (e.g., 1Password, Bitwarden, LastPass)
  - For storing WALLET_MASTER_KEY and DACC_MNEMONIC

- [ ] **Admin access** to the Eggo PocketBase GitHub repository

---

## Quick Start

For automated setup, use the provided script:

```bash
cd /path/to/eggo-pocketbase
./scripts/setup-secrets.sh
```

The script will:

1. Check OpenSSL availability
2. Create `.env.production` from template if needed
3. Generate `WALLET_MASTER_KEY` automatically
4. Validate all required variables
5. Show commands for adding secrets to GitHub

For manual setup, follow the step-by-step guide below.

---

## Step-by-Step Setup

### 1. Generate WALLET_MASTER_KEY

The `WALLET_MASTER_KEY` is the most critical secret in your deployment. It encrypts ALL user private keys stored in the database.

⚠️ **CRITICAL WARNING**: If you lose this key, all user wallets become PERMANENTLY UNRECOVERABLE.

#### Generate the Key

```bash
# Generate a 256-bit (32-byte) key
openssl rand -hex 32
```

Example output:

```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

#### Store Securely

1. **Copy the key** to your password manager immediately
2. **Label it**: "Eggo PocketBase - WALLET_MASTER_KEY (Production)"
3. **Enable encryption** in your password manager
4. **Add notes**: "Encrypts all user private keys in database"
5. **Create a backup** in a separate secure location

#### Add to .env.production

Edit `.env.production`:

```bash
WALLET_MASTER_KEY=your-generated-key-here
```

---

### 2. Set Up LINE OAuth Credentials

LINE OAuth allows users to log in with their LINE accounts.

#### Create LINE Login Channel

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Log in with your LINE account
3. Click **"Create a new provider"**
4. Enter provider name: "Eggo PocketBase"
5. Create channel:
   - Channel type: **LINE Login**
   - Channel name: **Eggo Production**
   - Channel description: **Production LINE Login for Eggo PocketBase**
   - App types: Select **Web app**

#### Configure Channel Settings

1. Go to **LINE Login** tab
2. Set **Callback URL**:
   ```
   https://pb.eggoworld.io/api/oauth2-redirect
   ```
3. Enable **Email** permission (optional but recommended)

#### Get Credentials

1. Go to **Channel settings** tab
2. Copy **Channel ID** (LINE_CHANNEL_ID)
3. Copy **Channel Secret** (LINE_CHANNEL_SECRET)
4. Store both in your password manager

#### Add to .env.production

```bash
LINE_CHANNEL_ID=your-channel-id-here
LINE_CHANNEL_SECRET=your-channel-secret-here
LINE_CALLBACK_URL=https://pb.eggoworld.io/api/oauth2-redirect
```

---

### 3. Generate DACC Mnemonic

The DACC mnemonic is a BIP39-compliant seed phrase for the DACC blockchain wallet.

#### Generate Mnemonic

Use a secure BIP39-compliant tool:

```bash
# Using Python with bip39 library
pip install bip39
python3 -c "from bip39 import Mnemonic; m = Mnemonic('english'); print(m.to_mnemonic())"

# Or use a hardware wallet (Ledger, Trezor) for maximum security
```

Example output:

```
abandon abandon ability able about above absent absorb abstract absurd abuse access accident
```

⚠️ **IMPORTANT**: The mnemonic should be 12-24 words separated by spaces.

#### Store Securely

1. **Copy the mnemonic** to your password manager
2. **Label it**: "Eggo PocketBase - DACC Mnemonic (Production)"
3. **NEVER write it down on paper** unless encrypted
4. **NEVER share it** with anyone
5. **NEVER commit it** to git

#### Add to .env.production

```bash
DACC_MNEMONIC=your-bip39-mnemonic-phrase-here
```

---

### 4. Configure Admin Credentials

These credentials provide full admin access to your PocketBase database.

#### Generate Secure Password

```bash
# Generate a 24-character password
openssl rand -base64 18
```

Example output:

```
Kj8#mP2$vL5@nQ9!rW3&sX6%zY4
```

#### Requirements

- **Minimum length**: 16 characters (recommended: 24+)
- **Include**: Uppercase, lowercase, numbers, symbols
- **Unique**: Not used anywhere else

#### Add to .env.production

```bash
POCKETBASE_ADMIN_EMAIL=admin@eggoworld.io
POCKETBASE_ADMIN_PASSWORD=your-secure-password-here
```

---

### 5. Add Secrets to GitHub

For automated deployments, store secrets in GitHub Actions Secrets.

#### Method 1: Using GitHub CLI

```bash
# Authenticate with GitHub (if not already)
gh auth login

# Navigate to your repository
cd /path/to/eggo-pocketbase

# Add secrets from .env.production
./scripts/setup-secrets.sh --github
```

#### Method 2: Manual (GitHub Web UI)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:

   | Name                        | Value                    | Description                |
   | --------------------------- | ------------------------ | -------------------------- |
   | `LINE_CHANNEL_ID`           | Your LINE Channel ID     | LINE OAuth channel ID      |
   | `LINE_CHANNEL_SECRET`       | Your LINE Channel Secret | LINE OAuth channel secret  |
   | `WALLET_MASTER_KEY`         | Generated hex key        | Encrypts user private keys |
   | `DACC_MNEMONIC`             | Your BIP39 mnemonic      | DACC wallet seed           |
   | `POCKETBASE_ADMIN_EMAIL`    | Admin email              | Admin account email        |
   | `POCKETBASE_ADMIN_PASSWORD` | Secure password          | Admin account password     |
   | `DEPLOYER_PRIVATE_KEY`      | Deployer private key     | Contract deployment wallet |

5. Click **Add secret** for each

⚠️ **WARNING**: Never commit secrets to your repository!

---

### 6. Verify Configuration

#### Run Validation Script

```bash
cd /path/to/eggo-pocketbase
./scripts/setup-secrets.sh --validate
```

Expected output:

```
✓ All required variables are valid!
```

#### Check .gitignore

Ensure `.env.production` is in `.gitignore`:

```bash
cat .gitignore | grep .env.production
```

Should see:

```
.env.production
```

If not present, add it:

```bash
echo ".env.production" >> .gitignore
git add .gitignore
git commit -m "Add .env.production to .gitignore"
```

#### Test Locally (Optional)

```bash
# Load secrets into environment
export $(cat .env.production | grep -v '^#' | xargs)

# Verify secrets are accessible
echo "LINE_CHANNEL_ID: ${LINE_CHANNEL_ID:0:10}..."
echo "WALLET_MASTER_KEY: ${WALLET_MASTER_KEY:0:10}..."
echo "DACC_MNEMONIC: ${DACC_MNEMONIC:0:20}..."
```

---

## GitHub Actions Integration

Your GitHub Actions workflow can use the secrets:

```yaml
# .github/workflows/deploy.yml
name: Deploy PocketBase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        env:
          LINE_CHANNEL_ID: ${{ secrets.LINE_CHANNEL_ID }}
          LINE_CHANNEL_SECRET: ${{ secrets.LINE_CHANNEL_SECRET }}
          WALLET_MASTER_KEY: ${{ secrets.WALLET_MASTER_KEY }}
          DACC_MNEMONIC: ${{ secrets.DACC_MNEMONIC }}
          POCKETBASE_ADMIN_EMAIL: ${{ secrets.POCKETBASE_ADMIN_EMAIL }}
          POCKETBASE_ADMIN_PASSWORD: ${{ secrets.POCKETBASE_ADMIN_PASSWORD }}
        run: |
          echo "Deploying with LINE Channel ID: $LINE_CHANNEL_ID"
          # Your deployment commands here
```

---

## Secrets Rotation

Regularly rotating secrets is essential for security.

### Rotation Schedule

| Secret            | Frequency           | Complexity                |
| ----------------- | ------------------- | ------------------------- |
| WALLET_MASTER_KEY | Annually            | High (requires migration) |
| LINE Credentials  | Bi-annually         | Medium                    |
| Admin Credentials | Quarterly           | Low                       |
| DACC_MNEMONIC     | Only if compromised | High (changes address)    |

### WALLET_MASTER_KEY Rotation

⚠️ **WARNING**: This is the most complex rotation as it requires re-encrypting all user private keys.

#### Procedure

1. **Generate new key**:

   ```bash
   openssl rand -hex 32
   ```

2. **Back up old key**:
   - Export to password manager
   - Label: "Eggo WALLET_MASTER_KEY (Old - Rotated YYYY-MM-DD)"
   - Archive with date

3. **Create migration script**:

   ```javascript
   // pb_migrations/NNN-rotate-wallet-key.js
   onRecordBeforeUpdate("users", (e) => {
     const encryptedKey = e.record.get("encrypted_private_key")
     const oldKey = process.env.OLD_WALLET_MASTER_KEY
     const newKey = process.env.WALLET_MASTER_KEY

     // Decrypt with old key
     const privateKey = decrypt(encryptedKey, oldKey)

     // Re-encrypt with new key
     const newEncryptedKey = encrypt(privateKey, newKey)

     e.record.set("encrypted_private_key", newEncryptedKey)
   })
   ```

4. **Update deployment**:

   ```bash
   # Add both old and new keys
   echo "OLD_WALLET_MASTER_KEY=$old_key" >> .env.production
   echo "WALLET_MASTER_KEY=$new_key" >> .env.production
   ```

5. **Run migration**:

   ```bash
   pocketbase migrate
   ```

6. **Deploy and verify**:
   - Deploy to production
   - Test wallet access for multiple users
   - Verify all encrypted keys work

7. **Remove old key**:
   - Only after full verification
   - Remove OLD_WALLET_MASTER_KEY from environment

8. **Archive old key**:
   - Keep in password manager for emergency recovery
   - Delete only after 30+ days of successful operation

### LINE Credentials Rotation

1. Generate new credentials in [LINE Developers Console](https://developers.line.biz/console/)
2. Update GitHub Secrets
3. Deploy to production
4. Test LINE OAuth login
5. Remove old credentials from LINE Console

### Admin Credentials Rotation

1. Change password in PocketBase Admin UI: `https://pb.eggoworld.io/_/`
2. Update POCKETBASE_ADMIN_PASSWORD in GitHub Secrets
3. Deploy to production
4. Test admin login with new password

### DACC Mnemonic Rotation

⚠️ **WARNING**: This changes the DACC wallet address.

1. Generate new mnemonic phrase
2. Update DACC_MNEMONIC in GitHub Secrets
3. Deploy to production
4. Update all smart contracts with new DACC address
5. Update frontend references
6. Test all DACC-related functionality

---

## Security Best Practices

### 1. Storage

✅ **DO:**

- Use a reputable password manager (1Password, Bitwarden)
- Enable 2FA on all developer accounts
- Store secrets in GitHub Actions Secrets
- Encrypt local copies of secrets

❌ **DON'T:**

- Commit secrets to git
- Share secrets via email, Slack, or chat
- Write down secrets on paper
- Store secrets in unencrypted files

### 2. Access Control

- **Admin accounts**: Only authorized team members
- **GitHub Actions**: Restrict who can modify secrets
- **Password managers**: Separate accounts for each team member
- **Audit logs**: Monitor who accesses secrets

### 3. Backup Strategy

1. **Primary storage**: Password manager
2. **Backup storage**: Encrypted cloud storage (e.g., iCloud Keychain, Google Vault)
3. **Emergency backup**: Physical secure location (e.g., safe deposit box)
4. **Team backup**: At least 2 team members have access

### 4. Monitoring

- **GitHub Actions**: Monitor deployment logs for secret usage
- **Access logs**: Monitor admin panel access
- **Failed auth**: Monitor failed login attempts
- **Wallet access**: Monitor wallet creation and access patterns

### 5. Incident Response

If a secret is compromised:

1. **Immediately rotate** the compromised secret
2. **Investigate** the breach (how was it exposed?)
3. **Audit** all systems that used the secret
4. **Document** the incident and lessons learned
5. **Notify** affected users if necessary

---

## Troubleshooting

### "WALLET_MASTER_KEY is not set or too short"

**Problem**: The WALLET_MASTER_KEY is missing or doesn't meet minimum requirements.

**Solution**:

```bash
# Generate a new key
openssl rand -hex 32

# Update .env.production
nano .env.production
# Replace WALLET_MASTER_KEY with the new key

# Validate
./scripts/setup-secrets.sh --validate
```

### "LINE OAuth not working"

**Problem**: Users cannot log in with LINE.

**Solution**:

1. Verify LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are correct
2. Check callback URL in LINE Console matches exactly: `https://pb.eggoworld.io/api/oauth2-redirect`
3. Ensure "Email" permission is enabled in LINE Console
4. Check PocketBase logs for error messages:
   ```bash
   docker-compose logs -f pocketbase
   ```

### "Secrets not loading in GitHub Actions"

**Problem**: Deployment fails because secrets are not available.

**Solution**:

1. Verify secrets are added to GitHub:

   ```bash
   gh secret list
   ```

2. Check workflow uses correct secret names:

   ```yaml
   env:
     LINE_CHANNEL_ID: ${{ secrets.LINE_CHANNEL_ID }}  # Correct
     LINE_CHANNEL_ID: ${{ secrets.LINE_ID }}         # Incorrect
   ```

3. Check repository permissions:
   - Settings → Actions → General → Workflow permissions
   - Ensure "Read and write permissions" is selected

### "Wallet decryption failed"

**Problem**: Cannot access user wallets after rotation.

**Solution**:

1. Verify WALLET_MASTER_KEY hasn't changed unexpectedly
2. Check if migration was completed successfully
3. Restore from backup if necessary
4. Contact support if issue persists

### Script not executable

**Problem**: Cannot run `./scripts/setup-secrets.sh`

**Solution**:

```bash
chmod +x scripts/setup-secrets.sh
./scripts/setup-secrets.sh
```

---

## Additional Resources

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [PocketBase Documentation](https://pocketbase.io/docs/)

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review PocketBase logs: `docker-compose logs -f pocketbase`
3. Check GitHub Actions logs for deployment errors
4. Contact the development team

---

**Last Updated**: 2026-04-12
**Version**: 1.0.0
