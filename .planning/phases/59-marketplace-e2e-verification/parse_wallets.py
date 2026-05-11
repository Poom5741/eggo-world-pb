#!/usr/bin/env python3
import sys, json

data = json.load(sys.stdin)
items = data.get("items", [])
for i in items:
    uid = str(i.get("user_id", "?"))[:16]
    wa = i.get("wallet_address", "no-wallet")
    bal = i.get("usdt_balance", 0)
    print(f"  User: {uid:16} | Wallet: {wa:42} | USDT: {bal}")
print(f"  Total: {len(items)} user_wallets")
