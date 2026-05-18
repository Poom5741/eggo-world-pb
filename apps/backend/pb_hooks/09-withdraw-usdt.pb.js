routerAdd("POST", "/api/v2/wallet/withdraw", (e) => {
    const requestInfo = e.requestInfo();
    if (!requestInfo.auth?.id) {
        return e.json(401, { success: false, error: { message: "Auth required", code: "AUTH_REQUIRED" } });
    }
    const body = requestInfo.body || {};
    const amount = body.amount;
    const external_wallet_address = body.external_wallet_address;

    if (!amount || amount <= 0) {
        return e.json(400, { success: false, error: { message: "Invalid params", code: "VALIDATION_ERROR" } });
    }
    if (!external_wallet_address || !external_wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return e.json(400, { success: false, error: { message: "Invalid address", code: "VALIDATION_ERROR" } });
    }

    try {
        var userRecord = $app.findRecordById("users", requestInfo.auth.id);
        if (!userRecord) return e.json(404, { success: false, error: { message: "Not found", code: "USER_NOT_FOUND" } });

        var user_address = userRecord.get("wallet") || "";
        if (!user_address) return e.json(400, { success: false, error: { message: "No wallet", code: "WALLET_NOT_FOUND" } });

        var walletRecord = $app.findFirstRecordByData("user_wallets", "user_id", userRecord.id);
        if (!walletRecord) return e.json(404, { success: false, error: { message: "Not found", code: "WALLET_NOT_FOUND" } });

        var balance = walletRecord.get("usdt_balance") || 0;
        var fee = amount * 0.05;
        var totalRequired = amount + fee;
        if (balance < totalRequired) return e.json(400, { success: false, error: { message: "Insufficient", code: "INSUFFICIENT_BALANCE" } });

        console.log("[withdraw] Creating record...");
        var col = $app.findCollectionByNameOrId("withdrawals");
        var record = new Record(col);
        record.set("user_id", userRecord.id);
        record.set("amount", amount);
        record.set("fee", fee);
        record.set("external_wallet_address", external_wallet_address);
        record.set("status", "pending");
        $app.save(record);
        console.log("[withdraw] Record saved:", record.id);

        console.log("[withdraw] Calling wallet-api...");
        var walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        var resp = $http.send({
            url: walletApiUrl + "/api/v1/wallet/transfer",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_address: external_wallet_address, amount: amount.toString(), user_id: userRecord.id })
        });
        console.log("[withdraw] wallet-api response status:", resp.statusCode);

        var responseData = null;
        if (resp.json && typeof resp.json === "object" && !Array.isArray(resp.json)) {
            responseData = resp.json;
        } else if (resp.body && Array.isArray(resp.body)) {
            var respBodyStr = "";
            for (var i = 0; i < resp.body.length; i++) {
                respBodyStr += String.fromCharCode(resp.body[i]);
            }
            try {
                responseData = JSON.parse(respBodyStr);
            } catch (parseErr) {
                console.error("[withdraw] Failed to parse response body:", respBodyStr);
            }
        }
        console.log("[withdraw] wallet-api response body:", JSON.stringify(responseData));

        if (resp.statusCode >= 200 && resp.statusCode < 300 && responseData && responseData.success) {
            var txHash = (responseData.data && responseData.data.txHash) || null;
            record.set("status", "completed");
            record.set("tx_hash", txHash);
            $app.save(record);

            var newBal = balance - totalRequired;
            walletRecord.set("usdt_balance", newBal);
            walletRecord.set("total_withdrawn", (walletRecord.get("total_withdrawn") || 0) + amount);
            $app.save(walletRecord);

            userRecord.set("usdt_balance", newBal);
            $app.save(userRecord);

            return e.json(200, { success: true, data: { amount: amount, fee: fee, new_balance: newBal, tx_hash: txHash } });
        }

        record.set("status", "failed");
        $app.save(record);

        var errorMsg = "Transfer failed";
        var errorCode = "TRANSFER_FAILED";
        if (responseData && responseData.error) {
            errorMsg = responseData.error.message || errorMsg;
            errorCode = responseData.error.code || errorCode;
        }
        console.error("[withdraw] Transfer failed:", errorMsg, errorCode);
        return e.json(400, { success: false, error: { message: errorMsg, code: errorCode } });
    } catch (err) {
        console.error("[withdraw] Error:", err.message);
        return e.json(500, { success: false, error: { message: err.message, code: "WITHDRAWAL_FAILED" } });
    }
});
