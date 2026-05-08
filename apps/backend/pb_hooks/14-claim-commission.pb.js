/**
 * Hook: 14-claim-commission.pb.js
 * Event: Router (POST /api/v2/claim-commission)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Get user's wallet
 * 3. Query unclaimed commission records
 * 4. Call CommissionDistribution.claimCommission()
 * 5. Update commission_records as claimed
 * 6. Update user usdt_total_earned
 * 7. Return claimed amount
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "claimed_amount": "10.5",
 *     "tx_hash": "0x...",
 *     "records_count": 3
 *   }
 * }
 */

routerAdd("POST", "/api/v2/claim-commission", (e) => {
    try {
        const requestInfo = e.requestInfo();
        const userId = requestInfo.auth?.id;
        if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
        let user;
        try { user = $app.findRecordById("users", userId); } catch (e) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }

        const wallet = $app.findFirstRecordByData("user_wallets", "user_id", user.id);

        if (!wallet) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Wallet not found',
                    code: 'WALLET_NOT_FOUND'
                } 
            });
        }

        const unclaimedRecords = $app.findRecordsByFilter("commission_records", "user.id = \"" + user.id + "\" && claimed = false", "", -1, 0);

        if (unclaimedRecords.length === 0) {
            return e.json(200, { 
                success: true, 
                data: { 
                    claimed_amount: '0',
                    tx_hash: null,
                    records_count: 0,
                    message: 'No unclaimed commissions'
                } 
            });
        }

        let totalClaimed = 0;
        for (const record of unclaimedRecords) {
            totalClaimed += parseFloat(record.get('amount') || '0');
        }

        // Call wallet-api to execute claim on-chain
        const walletApiUrl = $os.getenv("WALLET_SRV_URL") || "http://wallet-api:3001";
        const response = $http.send({
            url: walletApiUrl + "/api/wallet/claim-commission",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                wallet: wallet.get('wallet'),
                daccPublicKey: wallet.get('daccPublickey'),
                pin: wallet.get('pin'),
                commissionDistributionAddress: $os.getenv("COMMISSION_DISTRIBUTION_ADDRESS") || "0x9A1411db0344Bb1fDC6f3B6f04419B05C48dD7EF"
            })
        });

        let txHash = null;
        if (response.json && typeof response.json === "object") {
            txHash = response.json.data?.txHash || txHash;
        }

        const now = new Date().toISOString();
        for (const record of unclaimedRecords) {
            record.set('claimed', true);
            record.set('claimed_at', now);
            $app.save(record);
        }

        const totalEarned = parseFloat(user.get('usdt_total_earned') || '0');
        user.set('usdt_total_earned', (totalEarned + totalClaimed).toString());
        $app.save(user);

        console.log('Commission claimed:', { userId: user.id, claimedAmount: totalClaimed, txHash: txHash, recordsCount: unclaimedRecords.length });

        return e.json(200, { 
            success: true, 
            data: { 
                claimed_amount: totalClaimed.toString(),
                tx_hash: txHash,
                records_count: unclaimedRecords.length
            } 
        });

    } catch (err) {
        console.error('Claim commission failed', err);
        return e.json(500, { 
            success: false, 
            error: { 
                message: err.message || 'Claim failed',
                code: 'CLAIM_FAILED'
            } 
        });
    }
});

function callClaimCommissionContract(walletAddress, daccPublicKey, pin) {
    const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xaEF5bd8f90edB4532E39017746Fe6904d96A90E3';
    const commissionDistributionAddress = $os.getenv('COMMISSION_DISTRIBUTION_ADDRESS') || '0x9A1411db0344Bb1fDC6f3B6f04419B05C48dD7EF';
    
    const response = fetch('http://wallet-api:3001/api/wallet/claim-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wallet: walletAddress,
            daccPublicKey: daccPublicKey,
            pin: pin,
            commissionDistributionAddress: commissionDistributionAddress
        })
    });

    if (!response.ok) {
        const error = response.json();
        throw new Error(error.error?.message || 'Contract call failed');
    }

    const result = response.json();
    return result.data.txHash;
}
