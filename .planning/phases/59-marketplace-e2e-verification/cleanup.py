import requests, json

S = requests.Session()
r = S.post('http://localhost:8090/api/collections/_superusers/auth-with-password',
    json={'identity': 'admin@eggo.local', 'password': 'admin123'})
token = r.json()['token']
S.headers.update({'Authorization': f'Bearer {token}'})

# Clean up egg_nfts
r = S.get('http://localhost:8090/api/collections/egg_nfts/records?perPage=20')
for e in r.json().get('items', []):
    eid = e.get('id')
    S.delete(f'http://localhost:8090/api/collections/egg_nfts/records/{eid}')
    print(f'Deleted egg_nft {eid}')

# Clean up commission_records
r = S.get('http://localhost:8090/api/collections/commission_records/records?perPage=20')
for c in r.json().get('items', []):
    cid = c.get('id')
    S.delete(f'http://localhost:8090/api/collections/commission_records/records/{cid}')
    print(f'Deleted commission {cid}')

# Clean up transaction_logs
r = S.get('http://localhost:8090/api/collections/transaction_logs/records?perPage=20')
for t in r.json().get('items', []):
    tid = t.get('id')
    S.delete(f'http://localhost:8090/api/collections/transaction_logs/records/{tid}')
    print(f'Deleted tx_log {tid}')

# Restore seller USDT to 100
r = S.get('http://localhost:8090/api/collections/user_wallets/records?perPage=20')
for w in r.json().get('items', []):
    if w.get('user_id') == '2365hdkq6zo7x5y':
        wid = w.get('id')
        S.patch(f'http://localhost:8090/api/collections/user_wallets/records/{wid}', json={'usdt_balance': '100'})
        print(f'Restored seller USDT to 100')

print('Done!')
