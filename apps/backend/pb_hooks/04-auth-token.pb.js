// ===== AUTH USER ENDPOINT =====
// Get user info for verified LINE users

console.log("Setting up auth user endpoint...");

routerAdd('POST', '/api/auth/line-user', (c) => {
    const body = c.requestInfo().body;
    const email = body?.email;
    
    if (!email) {
        return c.json(400, { success: false, error: 'email is required' });
    }
    
    try {
        const user = $app.findAuthRecordByEmail('users', email);
        
        if (!user) {
            return c.json(404, { success: false, error: 'User not found' });
        }
        
        return c.json(200, {
            success: true,
            user: {
                id: user.id + '',
                email: user.getString('email') + '',
                name: user.getString('name') + '',
                wallet_address: user.getString('wallet_address') + ''
            }
        });
        
    } catch (err) {
        return c.json(500, { success: false, error: String(err) });
    }
});

console.log("Auth user endpoint registered");

// ===== AUTHENTICATE LINE USER =====
// Authenticate LINE user and return token

routerAdd('POST', '/api/auth/line-auth', (c) => {
    const body = c.requestInfo().body;
    const email = body?.email;
    const password = body?.password;
    
    if (!email || !password) {
        return c.json(400, { success: false, error: 'email and password are required' });
    }
    
    try {
        // Find the user
        const user = $app.findAuthRecordByEmail('users', email);
        
        if (!user) {
            return c.json(404, { success: false, error: 'User not found' });
        }
        
        // Update password
        user.set('password', password);
        $app.save(user);
        
        // Authenticate
        const authData = $apis.authWithPassword($app, c.request(), 'users', email, password);
        
        return c.json(200, {
            success: true,
            token: authData.token,
            user: {
                id: authData.record.id + '',
                email: authData.record.getString('email') + '',
                name: authData.record.getString('name') + '',
                wallet_address: authData.record.getString('wallet_address') + ''
            }
        });
        
    } catch (err) {
        return c.json(500, { success: false, error: String(err) });
    }
});

console.log("Line auth endpoint registered");