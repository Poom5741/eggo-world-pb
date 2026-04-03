/**
 * Hook: 13-mint-egg-nft.pb.js
 * Event: Router (POST /api/v2/mint-egg)
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Validate USDT balance (25 USDT required)
 * 3. Build referral chain (G1-G4) from referral_chain field
 * 4. Call EggNFT contract mintEgg(referrerChain)
 * 5. On success:
 *    - Create egg_nfts record
 *    - Deduct 25 USDT from buyer
 *    - Create commission_records for G1-G4
 *    - Update user usdt_balance
 *    - Emit event log
 * 
 * Request Body:
 * {
 *   "referrer_id": "user_id" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token_id": 1,
 *     "egg_id": 1,
 *     "tx_hash": "0x...",
 *     "food_count": 2,
 *     "referral_chain": [...]
 *   }
 * }
 */

// Use EGGO_CONFIG.game constants instead of declaring locally
const MINT_PRICE = "25000000000000000000"; // 25 USDT in wei (18 decimals)

routerAdd("POST", "/api/v2/mint-egg", (e) => {
    try {
        const user = $apis.requireAuth(e);
        
        const body = e.requestInfo?.body || {};
        const referrerId = body.referrer_id || null;

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

        const usdtBalance = parseFloat(wallet.get('usdt_balance') || '0');
        const mintPriceUsdt = 25;

        if (usdtBalance < mintPriceUsdt) {
            return e.json(400, { 
                success: false, 
                error: { 
                    message: `Insufficient USDT balance. Required: ${mintPriceUsdt} USDT, Available: ${usdtBalance} USDT`,
                    code: 'INSUFFICIENT_BALANCE'
                } 
            });
        }

        let referralChain = [null, null, null, null];
        
        if (referrerId) {
            const referrer = $app.dao().findRecordById('users', referrerId);
            if (!referrer) {
                return e.json(400, { 
                    success: false, 
                    error: { 
                        message: 'Referrer not found',
                        code: 'REFERRER_NOT_FOUND'
                    } 
                });
            }

            referralChain[0] = referrer.get('wallet');
            
            const referrerWallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
                '@owner': referrerId
            });
            
            if (referrerWallet) {
                const g2Id = referrerWallet.get('referrer_id');
                if (g2Id) {
                    const g2 = $app.dao().findRecordById('users', g2Id);
                    const g2Wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
                        '@owner': g2Id
                    });
                    if (g2 && g2Wallet) {
                        referralChain[1] = g2Wallet.get('wallet');
                        
                        const g3Id = g2Wallet.get('referrer_id');
                        if (g3Id) {
                            const g3 = $app.dao().findRecordById('users', g3Id);
                            const g3Wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
                                '@owner': g3Id
                            });
                            if (g3 && g3Wallet) {
                                referralChain[2] = g3Wallet.get('wallet');
                                
                                const g4Id = g3Wallet.get('referrer_id');
                                if (g4Id) {
                                    const g4 = $app.dao().findRecordById('users', g4Id);
                                    const g4Wallet = $app.dao().findFirstRecordByFilter('user_wallets', 'owner = {:owner}', {
                                        '@owner': g4Id
                                    });
                                    if (g4 && g4Wallet) {
                                        referralChain[3] = g4Wallet.get('wallet');
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const eggNftAddress = $app.settings().meta('eggNftContractAddress') || '';
        if (!eggNftAddress) {
            return e.json(500, { 
                success: false, 
                error: { 
                    message: 'EggNFT contract address not configured',
                    code: 'CONFIG_ERROR'
                } 
            });
        }

        const txHash = callMintEggContract(
            wallet.get('wallet'),
            wallet.get('daccPublickey'),
            wallet.get('pin'),
            referralChain,
            eggNftAddress
        );

        const collection = $app.dao().findCollectionByNameOrId('egg_nfts');
        const record = $app.dao().createRecord(collection);
        
        const raritySeed = Math.floor(Math.random() * 1000000);
        
        record.set('egg_id', Date.now());
        record.set('owner', user.id);
        record.set('token_id', parseInt(txHash.slice(-8), 16) % 1000000);
        record.set('contract_address', eggNftAddress.toLowerCase());
        record.set('food_count', EGGO_CONFIG.game.initialFoodCount);
        record.set('is_hatched', false);
        record.set('generation', 0);
        record.set('is_breeding_egg', false);
        record.set('parent1_animal_id', 0);
        record.set('parent2_animal_id', 0);
        record.set('rarity_upgrade_count', 0);
        record.set('rarity_seed', raritySeed);
        record.set('referral_chain', referralChain.filter(addr => addr !== null));
        record.set('tx_hash', txHash.toLowerCase());
        record.set('minted_at', new Date().toISOString());

        $app.dao().saveRecord(record);

        wallet.set('usdt_balance', (usdtBalance - mintPriceUsdt).toString());
        $app.dao().saveRecord(wallet);

        createCommissionRecords(user.id, referralChain, txHash, record.id);

        $app.logger().info('Egg NFT minted', {
            userId: user.id,
            tokenId: record.get('token_id'),
            eggId: record.get('egg_id'),
            txHash: txHash,
            referralChain: referralChain.filter(addr => addr !== null)
        });

        return e.json(200, { 
            success: true, 
            data: { 
                token_id: record.get('token_id'),
                egg_id: record.get('egg_id'),
                tx_hash: txHash,
                food_count: EGGO_CONFIG.game.initialFoodCount,
                is_hatched: false,
                generation: 0,
                rarity_seed: raritySeed,
                referral_chain: referralChain.filter(addr => addr !== null)
            } 
        });

    } catch (err) {
        $app.logger().error('Mint egg NFT failed', err);
        return e.json(500, { 
            success: false, 
            error: { 
                message: err.message || 'Mint failed',
                code: 'MINT_FAILED'
            } 
        });
    }
});

function callMintEggContract(walletAddress, daccPublicKey, pin, referralChain, eggNftAddress) {
    const response = fetch('http://wallet-api:3001/api/wallet/mint-egg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wallet: walletAddress,
            daccPublicKey: daccPublicKey,
            pin: pin,
            referralChain: referralChain,
            eggNftAddress: eggNftAddress
        })
    });

    if (!response.ok) {
        const error = response.json();
        throw new Error(error.error?.message || 'Contract call failed');
    }

    const result = response.json();
    return result.data.txHash;
}

function createCommissionRecords(buyerId, referralChain, txHash, eggRecordId) {
    const commissionPercents = [20, 10, 10, 10];
    const mintPrice = 25;
    
    const collection = $app.dao().findCollectionByNameOrId('commission_records');
    
    for (let i = 0; i < referralChain.length; i++) {
        if (referralChain[i] === null) continue;
        
        const referrerWallet = $app.dao().findFirstRecordByFilter('user_wallets', 'wallet = {:wallet}', {
            '@wallet': referralChain[i]
        });
        
        if (!referrerWallet) continue;
        
        const commissionAmount = (mintPrice * commissionPercents[i]) / 100;
        
        const record = $app.dao().createRecord(collection);
        record.set('user', referrerWallet.get('owner'));
        record.set('level', i + 1);
        record.set('amount', commissionAmount);
        record.set('tx_hash', txHash.toLowerCase());
        record.set('from_egg', eggRecordId);
        record.set('claimed', false);
        record.set('claimed_at', null);
        
        $app.dao().saveRecord(record);
        
        const referrerUser = $app.dao().findRecordById('users', referrerWallet.get('owner'));
        const totalEarned = parseFloat(referrerUser.get('usdt_total_earned') || '0');
        referrerUser.set('usdt_total_earned', (totalEarned + commissionAmount).toString());
        $app.dao().saveRecord(referrerUser);
    }
}
