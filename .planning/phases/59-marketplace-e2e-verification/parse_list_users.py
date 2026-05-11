#!/usr/bin/env python3
import sys, json

data = json.load(sys.stdin)
for i in data.get("items", []):
    name = i.get("name", "?")
    uid = i["id"][:16]
    print(f"  {uid:16} | {name}")
print(f"  Total: {len(data.get('items',[]))}")
