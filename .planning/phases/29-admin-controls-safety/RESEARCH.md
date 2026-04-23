# Phase 29 Research: Admin Controls & Platform Safety

## Domain Overview
The goal is to implement smart contract admin functions (pause/unpause marketplace), backend hooks for platform pause state and fee sync, and frontend admin panel with emergency controls. This involves several layers:
- Smart contract admin controls (pause, unpause marketplace)
- Backend PocketBase hooks for platform state management
- Frontend admin panel UI
- Emergency control mechanisms

## Smart Contract Admin Functions

### Pause/Unpause Marketplace
Reference existing contracts in the `contracts/` directory to understand current structure:
- Need to implement Ownable and Pausable modifiers from OpenZeppelin
- Admin functions to pause/unpause key marketplace operations
- Consider which functions need pausing: minting, transfers, sales, etc.

### Key OpenZeppelin Contracts Relevant
- `Ownable`: Provides basic authorization control
- `Pausable`: Pausing mechanisms
- `AccessControl`: More granular permissions (future consideration)

### Implementation Pattern
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EggNFT is ERC721, ERC721Enumerable, Ownable, Pausable {
    constructor() ERC721("EggNFT", "EGG") Ownable(_msgSender()) {}
    
    function pause() public onlyOwner whenNotPaused {
        _pause();
    }
    
    function unpause() public onlyOwner whenPaused {
        _unpause();
    }
    
    // Functions subject to pause
    function mint(address to) public whenNotPaused returns (uint256) {
        // minting logic
    }
    
    function safeTransferFrom(address from, address to, uint256 tokenId) 
        public virtual override whenNotPaused {
        super.safeTransferFrom(from, to, tokenId);
    }
}
```

## Backend PocketBase Integration

### Hooks Structure
The system has a well-established hook pattern in `apps/backend/pb_hooks/`:
- Need to create admin-focused hooks with proper authentication
- Hooks should interface with smart contracts via wallet-api
- State persistence for platform pause in PocketBase collections

### Admin Authentication Pattern
Based on successful authentication implementation in other hooks:
```javascript
routerAdd("POST", "/api/v2/admin/marketplace-control", (e) => {
  try {
    const requestInfo = e.requestInfo()
    const user = $app.findRecordById("users", requestInfo.auth?.id);
    
    if (!user || user.get("role") !== "admin") {
      return e.json(403, { success: false, error: { message: "Admin access required" } });
    }
    
    // Perform admin action
    // Call wallet-api for blockchain operations
    
  } catch (err) {
    return e.json(500, { success: false, error: { message: err.message } });
  }
});
```

## Frontend Admin Panel

### Next.js Structure
The frontend is organized in `apps/web/app/`:
- New admin page at `apps/web/app/admin/page.tsx`
- Dashboard-style UI with emergency controls
- API endpoints pointing to PocketBase admin hooks

### UI Components Needed
Based on existing UI patterns (shadcn/ui, tailwind, lucide icons):
- Toggle switches for marketplace status
- Status indicators showing current state
- Action history/logs
- Emergency functions panel

### Authentication
- Use existing auth state and PocketBase client
- Admin role check before displaying UI elements

## Current Project Context

### Existing Features
Based on project knowledge:
- Users can sign in with LINE OAuth
- EVM wallet creation via hooks
- Minting eggs functionality exists
- USDT payment handling
- Balance checking (native and ERC20)

### Infrastructure
- Smart contracts deployed with Foundry
- Wallet-API for external functions
- PocketBase backend with extensive hook ecosystem
- Frontend deployed as static export

### Security Considerations
For admin functions, special attention to:
- Secure authentication and authorization
- Rate limiting for admin endpoints to prevent abuse
- Input validation for all parameters
- Secure key management for admin functions
- Audit trails for all admin actions

### Existing Deployment
Deployment currently uses Docker Compose in production, so new hooks need to be built into images via `docker-compose build`.

## Implementation Approach
The solution needs to touch multiple layers of the stack. A coordinated approach would be:
1. Smart contract modifications to add pause/unpause functions
2. New backend hooks for admin operations
3. Updates to existing wallet-api endpoints if needed
4. New frontend admin panel
5. Admin access role management