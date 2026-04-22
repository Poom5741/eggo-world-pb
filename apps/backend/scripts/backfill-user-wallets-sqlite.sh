#!/bin/bash
# Backfill user_wallets records using SQLite directly
# Run on production server

DB_PATH="/root/eggo-world-pb/apps/backend/pb_data/data.db"

echo "=== Backfilling user_wallets records ==="
echo "Database: $DB_PATH"

if [ ! -f "$DB_PATH" ]; then
  echo "✗ Database not found at $DB_PATH"
  exit 1
fi

# Find users with wallets but no user_wallets record
echo ""
echo "Finding users without user_wallets records..."

MISSING=$(sqlite3 "$DB_PATH" "
SELECT u.id, u.wallet, u.usdt_balance, u.usdt_total_earned
FROM users u
WHERE u.wallet != '' 
  AND u.wallet IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_wallets uw WHERE uw.user_id = u.id
  );
")

if [ -z "$MISSING" ]; then
  echo "✓ All users already have user_wallets records"
  exit 0
fi

# Count missing
COUNT=$(echo "$MISSING" | wc -l)
echo "Found $COUNT users missing user_wallets records"
echo ""

# Create records
CREATED=0
ERRORS=0

echo "$MISSING" | while IFS='|' read -r USER_ID WALLET USDT_BALANCE USDT_EARNED; do
  echo "Processing user: ${USER_ID:0:12}..."
  
  # Generate unique ID for user_wallets record (PocketBase format)
  WALLET_ID="r$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 14 | head -n 1)"
  
  # Set defaults
  USDT_BALANCE=${USDT_BALANCE:-0}
  USDT_EARNED=${USDT_EARNED:-0}
  
  # Insert record
  sqlite3 "$DB_PATH" "
    INSERT INTO user_wallets (
      id, user_id, wallet_address, usdt_balance, 
      total_earned, total_spent, total_withdrawn,
      created, updated
    ) VALUES (
      '$WALLET_ID', '$USER_ID', '$WALLET', $USDT_BALANCE,
      $USDT_EARNED, 0, 0,
      datetime('now'), datetime('now')
    );
  "
  
  if [ $? -eq 0 ]; then
    echo "✓ Created user_wallets for user ${USER_ID:0:12}..."
    CREATED=$((CREATED + 1))
  else
    echo "✗ Failed for user ${USER_ID:0:12}..."
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "=== Backfill Complete ==="
echo "Created: $CREATED"
echo "Errors: $ERRORS"
