// ===== DEPRECATED: CUSTOM LINE AUTH ENDPOINTS =====
// These endpoints are NO LONGER USED after migrating to PocketBase native OAuth2
// PocketBase now handles the entire OAuth2 flow automatically
// 
// Previously provided endpoints:
// - POST /api/auth/line-user (lookup user by email)
// - POST /api/auth/line-auth (authenticate with email/password)
// - POST /api/auth/line-exchange (exchange LINE code for tokens)
//
// These have been replaced by PocketBase's built-in:
// - /api/collections/users/auth-with-oauth2
//
// Keeping this file as reference only - can be safely deleted after verification

console.log("⚠️  Custom LINE auth endpoints are DEPRECATED - using PocketBase native OAuth2");
console.log("Remove this file (05-auth-token.pb.js) after verifying OAuth2 flow works");