#!/usr/bin/env python3
import sys, json

d = json.load(sys.stdin)
token = d.get("token", "NONE")
user = d.get("user", {})
name = user.get("name", "?")
print(f"Token: {token[:50]}...")
print(f"User: {name}")
