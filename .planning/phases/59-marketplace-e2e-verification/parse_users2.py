#!/usr/bin/env python3
import sys, json

data = json.load(sys.stdin)
for i in data.get("items", []):
    uid = i["id"][:16]
    name = i.get("name", "?")
    email = i.get("email", "?")
    wallet = i.get("wallet", "")[:20] if i.get("wallet") else "N/A"
    print(f"{uid:16} | {name:15} | {email:35} | wallet={wallet}")
