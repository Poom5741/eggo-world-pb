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
        const users = $app.dao().findCollectionByNameOrId('users');
        const user = $app.dao().findAuthRecordByEmail(users, email);

        if (!user) {
            return c.json(404, { success: false, error: 'User not found' });
        }

        return c.json(200, {
            success: true,
            user: {
                id: user.id + '',
                email: user.email() + '',
                name: user.string('name') + '',
                wallet_address: user.string('wallet_address') + ''
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
    console.log("=== LINE-AUTH ENDPOINT CALLED ===");
    const body = c.requestInfo().body;
    console.log("Request body:", JSON.stringify(body));

    const email = body?.email;
    const password = body?.password;

    console.log("Email:", email);
    console.log("Password:", password ? `${password.length} chars: ${password.substring(0, 8)}...` : 'undefined');

    if (!email || !password) {
        console.log("Missing email or password");
        return c.json(400, { success: false, error: 'email and password are required' });
    }

    try {
        console.log("Finding user by email...");
        const users = $app.dao().findCollectionByNameOrId('users');
        const user = $app.dao().findAuthRecordByEmail(users, email);

        if (!user) {
            console.log("User not found");
            return c.json(404, { success: false, error: 'User not found' });
        }

        console.log("User found:", user.id);
        console.log("Updating password...");

        // Update password using the proper PocketBase API
        user.setPassword(password);
        $app.dao().saveRecord(user);

        console.log("Authenticating...");

        // Authenticate
        const authData = $apis.authWithPassword($app, c.request(), users, email, password);

        console.log("Authentication successful");

        return c.json(200, {
            success: true,
            token: authData.token,
            user: {
                id: authData.record.id + '',
                email: authData.record.email() + '',
                name: authData.record.string('name') + '',
                wallet_address: authData.record.string('wallet_address') + ''
            }
        });

    } catch (err) {
        console.log("Error:", String(err));
        return c.json(500, { success: false, error: String(err) });
    }
});

console.log("Line auth endpoint registered");