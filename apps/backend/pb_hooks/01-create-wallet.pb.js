// ===== CREATE WALLET HOOK =====
// Call wallet-api service when user is created via OAuth

console.log("Setting up create wallet hook...");

const WALLET_API_URL = process.env.WALLET_API_URL || "http://wallet-api:3001";

onRecordAfterCreateSuccess((e) => {
    console.log("=== WALLET HOOK FIRED ===");
    console.log("Record ID:", e.record.id);
    
    const existingWallet = e.record.getString("wallet_address");
    if (existingWallet && existingWallet.startsWith("0x")) {
        console.log("User already has wallet:", existingWallet);
        return;
    }
    
    const userId = e.record.id;
    console.log("Creating wallet for:", userId);
    
    let address = "";
    let publicKey = "";
    let encryptedKey = "{}";
    let version = 1;
    
    try {
        const response = $http.send({
            url: WALLET_API_URL + "/api/wallet/create",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId }),
            timeout: 10
        });
        
        console.log("API status:", response.statusCode);
        
        if (response.statusCode === 200) {
            let bodyBytes = response.body;
            
            let bodyStr = '';
            if (Array.isArray(bodyBytes)) {
                for (let i = 0; i < bodyBytes.length; i++) {
                    bodyStr += String.fromCharCode(bodyBytes[i]);
                }
            } else {
                bodyStr = String(bodyBytes);
            }
            
            let data = JSON.parse(bodyStr);
            
            if (data && data.success && data.data) {
                address = data.data.address || "";
                let pk = data.data.publicKey || "";
                if (pk.length > 42) {
                    pk = pk.substring(0, 42);
                }
                publicKey = pk;
                encryptedKey = JSON.stringify(data.data.encryptedPrivateKey || {});
                version = data.data.version || 3;
                console.log("Got wallet:", address);
            }
        }
    } catch (err) {
        console.log("API error:", err);
    }
    
    if (!address) {
        console.log("Generating placeholder wallet");
        const hexChars = "0123456789abcdef";
        address = "0x";
        publicKey = "0x";
        for (let i = 0; i < 40; i++) {
            address += hexChars[Math.floor(Math.random() * 16)];
            publicKey += hexChars[Math.floor(Math.random() * 16)];
        }
        version = 1;
    }
    
    e.record.set("wallet_address", address);
    e.record.set("publicKey", publicKey);
    e.record.set("wallet_version", version);
    e.record.set("encrypted_private_key", encryptedKey);
    
    $app.save(e.record);
    console.log("Wallet saved:", address);

}, "users");

console.log("Create wallet hook registered");
console.log("Wallet API URL:", WALLET_API_URL);