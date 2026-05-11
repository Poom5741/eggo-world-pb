#!/opt/homebrew/bin/fish
set PB_TOKEN "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc3ODUyMDE3NCwiaWQiOiJuNjR3Yzdvc3dwa2wxeTkiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.ozbNSa-n5y6Lo_ewUhssjF8hJOMvE23Ki7lHku_D31w"

echo "=== Egg NFT record ==="
curl -s "http://localhost:8090/api/collections/egg_nfts/records?filter=(egg_id%3D1778433239028)" -H "Authorization: Bearer $PB_TOKEN"

echo ""
echo ""
echo "=== Current marketplace_listings ==="
curl -s "http://localhost:8090/api/collections/marketplace_listings/records" -H "Authorization: Bearer $PB_TOKEN"
