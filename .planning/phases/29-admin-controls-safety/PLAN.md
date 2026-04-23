# Phase 29: Admin Controls & Platform Safety - Detailed Plan

## Objective
Implement smart contract admin functions (pause/unpause marketplace), backend hooks for platform pause state and fee sync, and frontend admin panel with emergency controls.

## Scope
- Smart contract: Add admin pausing functionality
- Backend: Create PocketBase hooks for admin controls
- Frontend: Develop admin panel UI
- Wallet API: Extend to handle pausing operations
- Security: Proper admin authentication and authorization

## Deliverables

### 1. Smart Contract Modifications
**Files:** `contracts/src/EggNFT.sol` or similar contract files
**Tasks:**
- [ ] Extend existing EggNFT contract with Pausable and Ownable functionality
- [ ] Add onlyOwner access control for pause/unpause functions  
- [ ] Add whenNotPaused modifier to sensitive functions like minting, transfers
- [ ] Create migration/deployment script for updated contracts
- [ ] Update contract verification scripts

#### Implementation Plan
1. Update contract inheritance to include OpenZeppelin's Ownable and Pausable
2. Add admin functions `pause()` and `unpause()` with `onlyOwner` modifier
3. Apply `whenNotPaused` modifier to critical operations like minting
4. Follow established pattern of other contracts in the repo
5. Ensure backward compatibility for non-paused operations

#### Validation
- [ ] Test that only owner can call pause/unpause 
- [ ] Verify paused contract rejects mint/transfer operations
- [ ] Confirm non-sensitive ops still work when paused
- [ ] Verify deploy script updates contract properly on testnet
- [ ] Contract verification passes on block explorer

### 2. Backend PocketBase Hooks
**Files:** `apps/backend/pb_hooks/XX-marketplace-control.pb.js`
**Tasks:**
- [ ] Create router hook for admin marketplace control
- [ ] Implement role-based authentication for admin access
- [ ] Add business logic to interface with smart contracts through wallet-api
- [ ] Include error handling and logging for audit trail
- [ ] Create endpoint for platform status checking

#### Implementation Plan
1. Create new hook file with appropriate naming convention (higher number for execution order)
2. Implement role checking for admin access
3. Define admin endpoints: get platform status, pause marketplace, unpause marketplace
4. Interface with wallet-api to execute smart contract admin functions
5. Add logging and audit trail for all admin operations

#### Validation
- [ ] Only admin accounts can access marketplace control endpoints
- [ ] API calls to contract result in successful pause/unpause
- [ ] Status endpoint correctly reports current platform status
- [ ] Error handling returns appropriate error codes
- [ ] Audit trail logs all operations with user info and timestamps

### 3. Admin Frontend Dashboard
**Files:** `apps/web/app/admin/`, components for admin UI
**Tasks:**
- [ ] Create admin page layout using existing patterns
- [ ] Implement marketplace control UI (toggle switch, status indicators)
- [ ] Design emergency controls section
- [ ] Add authentication check to prevent unauthorized access
- [ ] Create status monitoring displays

#### Implementation Plan
1. Create new app router route `apps/web/app/admin/page.tsx`
2. Implement authentication check component
3. Create control UI components using shadcn patterns
4. Connect to backend admin endpoints
5. Display real-time platform status and activity logs

#### Validation
- [ ] Admin page accessible only to admin users
- [ ] Controls work to pause/unpause marketplace through backend
- [ ] Current status displayed in real-time
- [ ] Layout follows existing app design using shadcn/tailwind
- [ ] Loading states and error handling properly implemented

### 4. Wallet API Extension
**Files:** `wallet-api/server.js`
**Tasks:**
- [ ] Add endpoints to interface with admin contract functions
- [ ] Ensure secure key handling for contract admin operations  
- [ ] Add logging for admin operations
- [ ] Validate appropriate return responses for frontend

#### Implementation Plan
1. Add `POST /api/v1/admin/control` endpoint
2. Use contract ABI and address to call admin functions
3. Ensure secure handling of admin private keys
4. Include transaction tracking for audit purposes
5. Return appropriate success/error responses

#### Validation
- [ ] Admin operation endpoints securely execute on contracts
- [ ] Proper authentication before executing operations
- [ ] Transaction hash and status data correctly returned
- [ ] Failed operations return appropriate error response
- [ ] Logging works properly for audit trail

### 5. Admin Role Management
**Files:** `apps/backend/collections/users.ejf` (collection config), potential new hook
**Tasks:**
- [ ] Define admin role in users collection (if not exists)
- [ ] Implement user upgrade to admin capability (potentially secured)
- [ ] Document admin role assignment process
- [ ] Consider adding admin role validation hook

#### Implementation Plan
1. Configure admin role field in users collection
2. Potentially add secure method for promoting users to admin (could be done manually initially)
3. Ensure other authentication hooks respect admin status
4. Update documentation for admin role assignment

#### Validation
- [ ] Users can be granted admin role appropriately  
- [ ] Admin authentication functions work across all systems
- [ ] Regular users remain restricted from admin functions
- [ ] No security bypasses are introduced for admin access

## Implementation Priority
1. Smart contract admin functions (foundation layer)
2. Wallet API extensions 
3. Backend PocketBase hooks (security validation)
4. Admin role management (access control)
5. Frontend admin panel (interface)

## Dependencies
- Phase completion requires contracts to be deployed with admin features enabled
- Backend implementation depends on wallet-api having admin function endpoints
- Frontend depends on backend hooks being accessible
- Admin roles must be properly set up before UI activation

## Risks & Mitigation
- Risk: Improper admin access could lead to unauthorized platform changes
  - Mitigate: Careful authentication, authorization, and audit logging
- Risk: Smart contract pausing could affect legitimate users
  - Mitigate: Clear notifications, gradual roll-out, rollback plan
- Risk: Admin UI could accidentally execute destructive operations
  - Mitigate: Confirmation dialogs, access logging, role verification

## Security Validation
- [ ] No hardcoded credentials in any system layers
- [ ] Admin endpoints are properly protected and validated
- [ ] Logging records all admin actions for audit trail  
- [ ] Smart contract admin access limited to specific addresses
- [ ] No admin escalation vulnerabilities are introduced