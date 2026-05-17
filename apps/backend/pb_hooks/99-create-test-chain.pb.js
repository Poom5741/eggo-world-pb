console.log("Setting up create test chain endpoint...")

routerAdd("POST", "/api/v2/create-test-chain", (e) => {
    console.log("=== CREATE TEST CHAIN CALLED ===")

    try {
        var platformAddr = $os.getenv("PLATFORM_ADDRESS") || "0x0000000000000000000000000000000000000000"
        var ts = Date.now().toString(16).slice(-10).padStart(10, "0")
        var created = []

        // Step 1: G4
        console.log("[TC] typeof Record:", typeof Record)
        var c = $app.findCollectionByNameOrId("_pb_users_auth_")
        var u = new Record(c)
        u.set("name", "TestChain G4")
        u.set("email", "tc-g4-" + ts + "@eggo.test")
        u.set("externalId", "tc_g4_" + ts)
        u.set("password", "TestPass123!")
        u.set("passwordConfirm", "TestPass123!")
        u.set("emailVisibility", false)
        u.set("wallet", "0x00000000000000000000000000000" + ts + "4")
        u.set("daccPublickey", "daccPublickey_0x00000000000000000000000000000" + ts + "4_tc_" + ts)
        u.set("pin", "TestChainPin123!@#")
        u.set("referral_chain", JSON.stringify([platformAddr, platformAddr, platformAddr, platformAddr]))
        $app.save(u)
        console.log("[TC] G4 saved:", u.id)
        created.push({ label: "G4", id: u.id })

        // Step 2: G3
        var g3 = new Record(c)
        g3.set("name", "TestChain G3")
        g3.set("email", "tc-g3-" + ts + "@eggo.test")
        g3.set("externalId", "tc_g3_" + ts)
        g3.set("password", "TestPass123!")
        g3.set("passwordConfirm", "TestPass123!")
        g3.set("emailVisibility", false)
        g3.set("wallet", "0x00000000000000000000000000000" + ts + "3")
        g3.set("daccPublickey", "daccPublickey_0x00000000000000000000000000000" + ts + "3_tc_" + ts)
        g3.set("pin", "TestChainPin123!@#")
        g3.set("referrer_id", u.id)
        g3.set("referral_chain", JSON.stringify([u.id, platformAddr, platformAddr, platformAddr]))
        $app.save(g3)
        console.log("[TC] G3 saved:", g3.id)
        created.push({ label: "G3", id: g3.id })

        // Step 3: G2
        var g2 = new Record(c)
        g2.set("name", "TestChain G2")
        g2.set("email", "tc-g2-" + ts + "@eggo.test")
        g2.set("externalId", "tc_g2_" + ts)
        g2.set("password", "TestPass123!")
        g2.set("passwordConfirm", "TestPass123!")
        g2.set("emailVisibility", false)
        g2.set("wallet", "0x00000000000000000000000000000" + ts + "2")
        g2.set("daccPublickey", "daccPublickey_0x00000000000000000000000000000" + ts + "2_tc_" + ts)
        g2.set("pin", "TestChainPin123!@#")
        g2.set("referrer_id", g3.id)
        g2.set("referral_chain", JSON.stringify([g3.id, u.id, platformAddr, platformAddr]))
        $app.save(g2)
        console.log("[TC] G2 saved:", g2.id)
        created.push({ label: "G2", id: g2.id })

        // Step 4: G1
        var g1 = new Record(c)
        g1.set("name", "TestChain G1")
        g1.set("email", "tc-g1-" + ts + "@eggo.test")
        g1.set("externalId", "tc_g1_" + ts)
        g1.set("password", "TestPass123!")
        g1.set("passwordConfirm", "TestPass123!")
        g1.set("emailVisibility", false)
        g1.set("wallet", "0x00000000000000000000000000000" + ts + "1")
        g1.set("daccPublickey", "daccPublickey_0x00000000000000000000000000000" + ts + "1_tc_" + ts)
        g1.set("pin", "TestChainPin123!@#")
        g1.set("referrer_id", g2.id)
        g1.set("referral_chain", JSON.stringify([g2.id, g3.id, u.id, platformAddr]))
        $app.save(g1)
        console.log("[TC] G1 saved:", g1.id)
        created.push({ label: "G1", id: g1.id })

        // Step 5: BUYER
        var b = new Record(c)
        b.set("name", "TestChain BUYER")
        b.set("email", "tc-buyer-" + ts + "@eggo.test")
        b.set("externalId", "tc_buyer_" + ts)
        b.set("password", "TestPass123!")
        b.set("passwordConfirm", "TestPass123!")
        b.set("emailVisibility", false)
        b.set("wallet", "0x00000000000000000000000000000" + ts + "B")
        b.set("daccPublickey", "daccPublickey_0x00000000000000000000000000000" + ts + "B_tc_" + ts)
        b.set("pin", "TestChainPin123!@#")
        b.set("referral_chain", JSON.stringify([platformAddr, platformAddr, platformAddr, platformAddr]))
        $app.save(b)
        console.log("[TC] BUYER saved:", b.id)
        created.push({ label: "BUYER", id: b.id })

        // Update BUYER's user_wallets with 1000 USDT balance (wallet hook already created the record)
        console.log("[TC] Setting BUYER USDT balance to 1000")
        var buyerWallet = $app.findFirstRecordByData("user_wallets", "user_id", b.id)
        if (buyerWallet) {
            buyerWallet.set("usdt_balance", 1000)
            $app.save(buyerWallet)
            console.log("[TC] BUYER wallet balance set to 1000")
        } else {
            console.log("[TC] BUYER wallet record not found, creating one")
            var wc = $app.findCollectionByNameOrId("user_wallets")
            var bw = new Record(wc)
            bw.set("user_id", b.id)
            bw.set("wallet_address", b.get("wallet"))
            bw.set("usdt_balance", 1000)
            bw.set("total_earned", 0)
            bw.set("total_spent", 0)
            bw.set("total_withdrawn", 0)
            bw.set("last_polled_block", 0)
            $app.save(bw)
        }

        return e.json(200, {
            success: true,
            users: created,
            test_flow: "Auth as BUYER then POST /api/v2/mint-egg { referrer_id: '" + g1.id + "' }",
            buyer: { id: b.id, email: b.get("email"), password: "TestPass123!" },
            g1_id: g1.id
        })

    } catch (error) {
        console.error("[TC] ERROR:", error)
        console.error("[TC] ERROR stack:", error.stack)
        return e.json(500, {
            success: false,
            error: { message: error.message || String(error), code: "CREATE_TEST_CHAIN_FAILED" }
        })
    }
})

console.log("Create test chain endpoint registered")
