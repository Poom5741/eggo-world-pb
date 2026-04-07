// pb_hooks/24-fix-collection-rules.pb.js
// Run this ONCE to apply correct API rules to all collections
// After it runs successfully, you can delete or disable this file

console.log("Loading collection rules fix hook...");

routerAdd('POST', '/api/admin/fix-collection-rules', (e) => {
    console.log("=== COLLECTION RULES FIX - STARTING ===");
    
    const collections = [
        {
            name: "users",
            listRule: "id = @request.auth.id",
            viewRule: "id = @request.auth.id"
        },
        {
            name: "egg_nfts",
            listRule: "@request.auth.id != \"\" && owner = @request.auth.id",
            viewRule: "@request.auth.id != \"\" && owner = @request.auth.id"
        },
        {
            name: "commission_records",
            listRule: "@request.auth.id != \"\" && user = @request.auth.id",
            viewRule: "@request.auth.id != \"\" && user = @request.auth.id"
        },
        {
            name: "transactions",
            listRule: "user = @request.auth.id",
            viewRule: "user = @request.auth.id"
        },
        {
            name: "food_nfts",
            listRule: "@request.auth.id != \"\" && owner = @request.auth.id",
            viewRule: "@request.auth.id != \"\" && owner = @request.auth.id"
        },
        {
            name: "animal_nfts",
            listRule: "@request.auth.id != \"\" && owner = @request.auth.id",
            viewRule: "@request.auth.id != \"\" && owner = @request.auth.id"
        },
        {
            name: "user_wallets",
            listRule: "user_id = @request.auth.id",
            viewRule: "user_id = @request.auth.id"
        },
        {
            name: "referrals",
            listRule: "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)",
            viewRule: "@request.auth.id != \"\" && (referrer_id = @request.auth.id || referee_id = @request.auth.id)"
        },
        {
            name: "wallet_configs",
            listRule: "@request.auth.id != \"\"",
            viewRule: "@request.auth.id != \"\""
        },
        {
            name: "egg_consumption_logs",
            listRule: "@request.auth.id != \"\" && egg.owner = @request.auth.id",
            viewRule: "@request.auth.id != \"\" && egg.owner = @request.auth.id"
        },
        {
            name: "marketplace_listings",
            listRule: "status = 'active'",
            viewRule: "status = 'active' || seller = @request.auth.id || buyer = @request.auth.id"
        },
        {
            name: "sync_state",
            listRule: null, // Keep superuser only
            viewRule: null
        }
    ];
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    try {
        // Get all collections from database
        const allCollections = $app.findAllCollections();
        console.log(`Found ${allCollections.length} collections in database`);
        
        for (const config of collections) {
            try {
                const collection = allCollections.find(c => c.name === config.name);
                
                if (!collection) {
                    console.error(`❌ Collection '${config.name}' not found`);
                    results.push({
                        name: config.name,
                        status: "error",
                        message: "Collection not found"
                    });
                    errorCount++;
                    continue;
                }
                
                const oldListRule = collection.listRule;
                const oldViewRule = collection.viewRule;
                
                collection.listRule = config.listRule;
                collection.viewRule = config.viewRule;
                
                $app.save(collection);
                
                console.log(`✅ ${config.name}:`);
                console.log(`   OLD list: ${oldListRule || 'null'}`);
                console.log(`   NEW list: ${config.listRule || 'null'}`);
                console.log(`   OLD view: ${oldViewRule || 'null'}`);
                console.log(`   NEW view: ${config.viewRule || 'null'}`);
                
                results.push({
                    name: config.name,
                    status: "updated",
                    oldListRule: oldListRule,
                    newListRule: config.listRule,
                    oldViewRule: oldViewRule,
                    newViewRule: config.viewRule
                });
                successCount++;
                
            } catch (err) {
                console.error(`❌ Error updating ${config.name}:`, err.message);
                results.push({
                    name: config.name,
                    status: "error",
                    message: err.message
                });
                errorCount++;
            }
        }
        
        const allCollectionsAfter = $app.findAllCollections();
        console.log(`Verified ${allCollectionsAfter.length} collections in database`);
        
        console.log("=== COLLECTION RULES FIX - COMPLETE ===");
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        
        e.json(200, {
            success: errorCount === 0,
            message: `Updated ${successCount} collections`,
            results
        });
        
    } catch (err) {
        console.error("FATAL ERROR:", err);
        e.json(500, {
            success: false,
            message: "Failed to fix collection rules: " + err.message,
            results
        });
    }
    
}, $apis.requireAuth());

console.log("Collection rules fix hook registered at POST /api/admin/fix-collection-rules");
console.log("This hook requires authentication (superuser or admin)");
