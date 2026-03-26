// ===== DEBUG REQUEST HOOK =====
// Debug endpoint to check what PocketBase receives

console.log("Setting up debug request hook...");

routerAdd('GET', '/api/debug/request', (c) => {
    const req = c.request;
    const h = req.header;
    
    return c.json(200, {
        // Try different ways to get host
        url: String(req.url),
        hostProperty: req.host,
        hostFromHeader: h.get('Host'),
        xfh: h.get('X-Forwarded-Host'),
        xfp: h.get('X-Forwarded-Proto')
    });
});

console.log("Debug request hook registered successfully");