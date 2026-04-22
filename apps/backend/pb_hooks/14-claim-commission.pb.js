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
        const user = $apis.requireAuth(e);

        const wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
            '@owner': user.id
        });

        if (!wallet) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: 'Wallet not found',
                    code: 'WALLET_NOT_FOUND'
                } 
            });
        }

        const unclaimedRecords = $app.dao().findRecordsByFilter('commission_records', 'user = {:user} && claimed = false', '', -1, -1, {
            '@user': user.id
        });

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

        const txHash = callClaimCommissionContract(
            wallet.get('wallet'),
            wallet.get('daccPublickey'),
            wallet.get('pin')
        );

        const now = new Date().toISOString();
        for (const record of unclaimedRecords) {
            record.set('claimed', true);
            record.set('claimed_at', now);
            $app.dao().saveRecord(record);
        }

        const totalEarned = parseFloat(user.get('usdt_total_earned') || '0');
        user.set('usdt_total_earned', (totalEarned + totalClaimed).toString());
        $app.dao().saveRecord(user);

        $app.logger().info('Commission claimed', {
            userId: user.id,
            claimedAmount: totalClaimed,
            txHash: txHash,
            recordsCount: unclaimedRecords.length
        });

        return e.json(200, { 
            success: true, 
            data: { 
                claimed_amount: totalClaimed.toString(),
                tx_hash: txHash,
                records_count: unclaimedRecords.length
            } 
        });

    } catch (err) {
        $app.logger().error('Claim commission failed', err);
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
    const eggNftAddress = $os.getenv('EGG_NFT_CONTRACT_ADDRESS') || '0xd7135090d78854820722CbCe0B29481Dd5D4808c';
    const commissionDistributionAddress = $os.getenv('COMMISSION_DISTRIBUTION_ADDRESS') || '0x3c48926556e766E4564af0E264A9980e7C3a1787';
    
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
