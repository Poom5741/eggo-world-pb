#!/usr/bin/env python3
import sys, json

d = json.load(sys.stdin)
print("Schema fields:")
for f in d.get("schema", []):
    print(f'  {f["name"]} ({f["type"]})')
