#!/usr/bin/env python3
import sys, json

data = json.load(sys.stdin)
for i in data.get("items", []):
    name = i.get("name", "?")
    email = i.get("email", "?")
    wallet = str(i.get("wallet", ""))[:20]
    print(f"  ID: {i['id'][:20]:20} | Name: {name:15} | Email: {email:25} | Wallet: {wallet:20}")
print(f"  Total: {len(data.get('items',[]))} users")
