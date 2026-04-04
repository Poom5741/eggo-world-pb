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
            "users",
            "email = {:email}",
            "",
            1,
            0,
            { email: email }
        )

        if (!records || records.length === 0) {
            return c.json(404, { success: false, error: "User not found" })
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
            "users",
            "email = {:email}",
            "",
            1,
            0,
            { email: email }
        )

        if (!records || records.length === 0) {
            console.log("User not found")
            return c.json(404, { success: false, error: "User not found" })
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

        // Return the user data for frontend authentication (password NOT returned for security)
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
        console.log("Error:", String(err));
        return c.json(500, { success: false, error: String(err) });
    }
});

console.log("Line auth endpoint registered")

// ===== LINE TOKEN EXCHANGE ENDPOINT =====
// Exchanges LINE auth code for tokens server-side (keeps client_secret secure)

routerAdd("POST", "/api/auth/line-exchange", (e) => {
    console.log("=== LINE-EXCHANGE ENDPOINT CALLED ===")
    const body = e.requestInfo().body
    const code = body?.code
    const redirectUri = body?.redirect_uri

    if (!code || !redirectUri) {
        return e.json(400, {
            success: false,
            error: { message: "code and redirect_uri are required", code: "MISSING_PARAMS" }
        })
    }

    // Read LINE credentials directly from env ($os.getenv is the correct PocketBase JSVM API)
    const channelId = $os.getenv("LINE_CHANNEL_ID") || ""
    const channelSecret = $os.getenv("LINE_CHANNEL_SECRET") || ""

    console.log("LINE channelId:", channelId ? channelId.substring(0, 4) + "..." : "(empty)")

    if (!channelId || !channelSecret) {
        console.log("LINE config missing")
        return e.json(500, {
            success: false,
            error: { message: "LINE credentials not configured", code: "CONFIG_ERROR" }
        })
    }

    try {
        // Exchange auth code for tokens via LINE API
        const tokenRes = $http.send({
            url: "https://api.line.me/oauth2/v2.1/token",
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${encodeURIComponent(channelId)}&client_secret=${encodeURIComponent(channelSecret)}`
        })

        console.log("LINE token response status:", tokenRes.statusCode)

        if (tokenRes.statusCode !== 200) {
            console.log("LINE token exchange failed:", tokenRes.raw)
            return e.json(400, {
                success: false,
                error: { message: "LINE token exchange failed: " + tokenRes.raw, code: "TOKEN_EXCHANGE_FAILED" }
            })
        }

        const tokens = tokenRes.json
        const accessToken = tokens.access_token
        const idToken = tokens.id_token

        if (!accessToken) {
            return e.json(400, {
                success: false,
                error: { message: "No access_token in LINE response", code: "TOKEN_MISSING" }
            })
        }

        // Decode id_token JWT payload (base64) to extract user profile
        let sub = ""
        let name = "LINE User"
        let picture = ""

        if (idToken) {
            try {
                const parts = idToken.split(".")
                if (parts.length >= 2) {
                    // Base64url decode the JWT payload
                    const jsonStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
                    const jwtPayload = JSON.parse(jsonStr)
                    sub = jwtPayload.sub || ""
                    name = jwtPayload.name || "LINE User"
                    picture = jwtPayload.picture || ""
                    console.log("Decoded JWT sub:", sub, "name:", name)
                }
            } catch (jwtErr) {
                console.log("JWT decode error:", String(jwtErr))
            }
        }

        // Fallback: get user info from LINE API if JWT decode failed
        if (!sub) {
            console.log("Falling back to LINE userinfo endpoint")
            const userInfoRes = $http.send({
                url: "https://api.line.me/oauth2/v2.1/userinfo",
                method: "GET",
                headers: { "Authorization": "Bearer " + accessToken }
            })

            if (userInfoRes.statusCode === 200) {
                const userInfo = userInfoRes.json
                sub = userInfo.sub || ""
                name = userInfo.name || "LINE User"
                picture = userInfo.picture || ""
                console.log("Got userinfo sub:", sub)
            } else {
                console.log("Userinfo failed:", userInfoRes.statusCode)
                return e.json(400, {
                    success: false,
                    error: { message: "Failed to get LINE user info", code: "USERINFO_FAILED" }
                })
            }
        }

        if (!sub) {
            return e.json(400, {
                success: false,
                error: { message: "Could not determine LINE user ID", code: "SUB_MISSING" }
            })
        }

        console.log("LINE exchange success for sub:", sub)

        return e.json(200, {
            success: true,
            data: {
                sub: sub,
                name: name,
                picture: picture,
                access_token: accessToken
            }
        })

    } catch (err) {
        console.log("LINE exchange error:", String(err))
        return e.json(500, {
            success: false,
            error: { message: String(err), code: "INTERNAL_ERROR" }
        })
    }
})

console.log("LINE exchange endpoint registered")