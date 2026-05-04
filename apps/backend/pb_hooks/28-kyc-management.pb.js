// KYC Management hook for user verification
routerAdd("PUT", "/api/v2/kyc/submit", (e) => {
    const requestInfo = e.requestInfo();
    const userId = requestInfo.auth?.id;
    if (!userId) { return e.json(401, { success: false, error: { message: "Authentication required", code: "AUTH_REQUIRED" } }); }
    let users;
    try { users = $app.findRecordById("users", userId); } catch (e) { return e.json(401, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
    const body = e.parseBody();
    
    try {
        users.set("kyc_verified", false);
        users.set("kyc_status", "pending");  
        users.set("kyc_submitted_date", new Date().toISOString());
        users.set("kyc_documents", JSON.stringify(body.documents || {}));
        users.set("kyc_country_residence", body.country || "");
        
        $app.save(users);
        
        e.json(200, {
            success: true,
            data: {
                message: "KYC submission recorded",
                status: "pending",
                next_review_eta: "3-5 business days"
            }
        });
    } catch (error) {
        console.error("KYC submission error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "KYC_SUBMISSION_FAILED" }
        });
    }
});

// Admin hook for reviewing KYC
routerAdd("POST", "/api/v2/admin/kyc-review", (e) => {
    const requestInfo = e.requestInfo();
    const isAdmin = requestInfo.auth && $app.findFirstRecordByData("users", "_superUser", requestInfo.auth.id) !== null;
    
    if (!isAdmin) {
        return e.json(401, {
            success: false,
            error: { message: "Administrator access required", code: "ADMIN_ACCESS_REQUIRED" }
        });
    }
    
    const body = e.parseBody();
    const { user_id, action, reason } = body;
    
    if (!user_id || !action) {
        return e.json(400, {
            success: false,
            error: { message: "user_id and action are required", code: "VALIDATION_ERROR" }
        });
    }
    
    if (!['approve', 'reject'].includes(action)) {
        return e.json(400, {
            success: false,
            error: { message: "action must be 'approve' or 'reject'", code: "VALIDATION_ERROR" }
        });
    }
    
    try {
        let userToReview;
        try { userToReview = $app.findRecordById("users", user_id); } catch (e) { return e.json(404, { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } }); }
        
        if (action === 'approve') {
            userToReview.set("kyc_verified", true);
            userToReview.set("kyc_status", "approved");
        } else {
            userToReview.set("kyc_verified", false);
            userToReview.set("kyc_status", "rejected");
            userToReview.set("kyc_rejection_reason", reason);
        }
        
        userToReview.set("kyc_reviewed_date", new Date().toISOString());
        userToReview.set("kyc_account_level", action === 'approve' ? "verified" : "basic");
        
        $app.save(userToReview);
        
        e.json(200, {
            success: true,
            data: {
                message: `KYC ${action}d successfully`,
                user_id: user_id,
                status: action === 'approve' ? 'approved' : 'rejected'
            }
        });
    } catch (error) {
        console.error("KYC admin review error:", error);
        e.json(500, {
            success: false,
            error: { message: error.message, code: "KYC_REVIEW_FAILED" }
        });
    }
});
