// pb_hooks/25-migrate-missing-collections.pb.js
// Run once to create missing collections (egg_nfts, commission_records, transactions, etc.)
// Then run 24-fix-collection-rules.pb.js to set correct permissions

console.log("=== COLLECTIONS MIGRATION HOOK LOADED ===");

routerAdd('POST', '/api/admin/migrate-missing-collections', (e) => {
    console.log("=== STARTING COLLECTIONS MIGRATION ===");
    
    const collectionsDir = '/pb_collections/';
    const fs = require('fs');
    
    const results = { created: [], skipped: [], errors: [] };
    
    try {
        // List all collection JSON files
        const jsonFiles = fs.readdir(collectionsDir)
            .filter(f => f.endsWith('.json'))
            .filter(f => f !== 'users.json'); // Skip users - already exists
        
        console.log(`Found ${jsonFiles.length} collection files to migrate`);
        
        for (const file of jsonFiles) {
            try {
                const filePath = collectionsDir + file;
                const jsonContent = fs.readFileSync(filePath, 'utf8');
                const collectionData = JSON.parse(jsonContent);
                
                // Check if collection already exists
                const existing = $app.findAllCollections().find(c => c.name === collectionData.name);
                
                if (existing) {
                    console.log(`⏭️  ${collectionData.name}: Already exists, skipping`);
                    results.skipped.push(collectionData.name);
                    continue;
                }
                
                // Create new collection
                const newCollection = $app.newCollection(collectionData);
                $app.save(newCollection);
                
                console.log(`✅ ${collectionData.name}: Created successfully`);
                results.created.push(collectionData.name);
                
            } catch (err) {
                console.error(`❌ ${file}: ${err.message}`);
                results.errors.push({ file, error: err.message });
            }
        }
        
        e.json(200, {
            success: results.errors.length === 0,
            message: "Migration complete",
            results
        });
        
    } catch (fatalErr) {
        console.error("FATAL:", fatalErr);
        e.json(500, {
            success: false,
            message: fatalErr.message,
            results
        });
    }
}, $apis.requireAuth());

console.log("Collections migration hook registered");
