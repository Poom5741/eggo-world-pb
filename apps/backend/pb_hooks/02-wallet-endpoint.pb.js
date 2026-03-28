// ===== WALLET API ENDPOINT =====
// Endpoint to call wallet-api service

console.log("Setting up wallet API endpoint...");

routerAdd('POST', '/api/wallet/create', (c) => {
    const body = c.requestInfo().body;
    const userId = body?.userId;
    
    if (!userId) {
        return c.json(400, { success: false, error: 'userId is required' });
    }
    
    const WALLET_API_URL = process.env.WALLET_API_URL || 'http://wallet-api:3001';
    
    console.log('Creating wallet for user:', userId);
    
    try {
        const response = $http.send({
            url: WALLET_API_URL + '/api/wallet/create',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId }),
            timeout: 10
        });
        
        console.log('API status:', response.statusCode);
        
        if (response.statusCode === 200) {
            let bodyBytes = response.body;
            
            let bodyStr = '';
            if (Array.isArray(bodyBytes)) {
                for (let i = 0; i < bodyBytes.length; i++) {
                    bodyStr += String.fromCharCode(bodyBytes[i]);
                }
            } else {
                bodyStr = String(bodyBytes);
            }
            
            let data = JSON.parse(bodyStr);
            
            if (data && data.success && data.data) {
                const walletData = data.data;
                
                try {
                    const record = $app.findRecordById('users', userId);
                    let publicKey = walletData.publicKey || '';
                    if (publicKey.length > 42) {
                        publicKey = publicKey.substring(0, 42);
                    }
                    
                    record.set('wallet_address', walletData.address);
                    record.set('publicKey', publicKey);
                    record.set('wallet_version', walletData.version || 3);
                    record.set('encrypted_private_key', JSON.stringify(walletData.encryptedPrivateKey || {}));
                    $app.save(record);
                    
                    console.log('Wallet saved:', walletData.address);
                    
                    return c.json(200, {
                        success: true,
                        data: {
                            userId: userId,
                            address: walletData.address
                        }
                    });
                } catch (saveErr) {
                    console.log('Save error:', saveErr);
                    return c.json(500, { success: false, error: 'Save failed: ' + saveErr });
                }
            }
        }
        
        return c.json(500, { success: false, error: 'API error' });
        
    } catch (err) {
        console.log('Error:', err);
        return c.json(500, { success: false, error: err });
    }
});

routerAdd('GET', '/api/wallet/status', (c) => {
    return c.json(200, { status: 'ok' });
});

console.log("Wallet API endpoint registered");