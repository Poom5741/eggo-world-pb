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
        const records = $app.findRecordsByFilter(
            'users',
            `email = "${email}"`,
            '',
            1
        );

        if (!records || records.length === 0) {
            return c.json(404, { success: false, error: 'User not found' });
        }

        const user = records[0];

        return c.json(200, {
            success: true,
            user: {
                id: user.id + '',
                email: user.get('email') + '',
                name: user.get('name') + '',
                wallet: user.get('wallet') + ''
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
    console.log("Password:", password ? `${password.length} chars` : 'undefined');

    if (!email || !password) {
        console.log("Missing email or password");
        return c.json(400, { success: false, error: 'email and password are required' });
    }

    try {
        console.log("Finding user by email...");
        const records = $app.findRecordsByFilter(
            'users',
            `email = "${email}"`,
            '',
            1
        );

        if (!records || records.length === 0) {
            console.log("User not found");
            return c.json(404, { success: false, error: 'User not found' });
        }

        const user = records[0];
        console.log("User found:", user.id);

        // Update password
        console.log("Updating password...");
        user.set('password', password);
        try {
            $app.save(user);
            console.log("Password updated successfully");
        } catch (saveErr) {
            console.log("Save error:", String(saveErr));
            // Continue anyway
        }

        console.log("Returning user data for frontend authentication");

        // Return the user data with password so frontend can authenticate
        return c.json(200, {
            success: true,
            user: {
                id: user.id + '',
                email: user.get('email') + '',
                name: user.get('name') + '',
                wallet: user.get('wallet') + ''
            },
            password: password
        });

    } catch (err) {
        console.log("Error:", String(err));
        return c.json(500, { success: false, error: String(err) });
    }
});

console.log("Line auth endpoint registered");