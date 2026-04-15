# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Frameworks

### Frontend (Next.js)

**Runner:**
- Bun test (built-in)
- Version: Latest via `@types/bun@latest`
- Configuration: No config file needed (uses Bun defaults)

**Assertion Libraries:**
- Bun's built-in `expect()`
- `@testing-library/react@^16.3.2` for component rendering
- `@testing-library/jest-dom@^6.9.1` for DOM matchers
- `@testing-library/user-event@^14.6.1` for user interactions

**Test Environment:**
- `jsdom` for DOM simulation
- `@happy-dom/global-registrator` for global Registrator
- `global-jsdom` for JSDOM implementation

**Run Commands:**
```bash
cd apps/web

# Run all tests
bun run test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage

# Specific test file
bun test components/FoodCard.test.tsx

# With pattern matching
bun test --grep "renders"
```

### Smart Contracts (Foundry)

**Runner:**
- Forge test (Foundry)
- Solidity version: `^0.8.24`
- Optimizer: Enabled with 200 runs

**Configuration (`contracts/foundry.toml`):**
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = true

[fuzz]
runs = 256
```

**Run Commands:**
```bash
cd contracts

# Run all tests
forge test

# Verbose output (v, vv, vvv)
forge test -vvv

# Specific test
forge test --match-test testName

# Specific file
forge test --match-path test/EggNFT.t.sol

# Coverage
forge coverage

# Coverage with report
forge coverage --report lcov
```

### Wallet API

**Runner:**
- Bun test
- Simple integration tests

**Run Commands:**
```bash
cd wallet-api
bun test
bun test wallet.test.ts
```

## Test File Organization

### Frontend

**Location:**
- Co-located with source files
- Same directory as component/page

**Naming:**
- Components: `{ComponentName}.test.tsx`
  - `FoodCard.test.tsx`
  - `EggCard.test.tsx`
  - `AccountModal.test.tsx`
  - `MarketplaceFilters.test.tsx`
- Pages: `{page-name}.test.ts` or `{page}.test.tsx`
  - `app/auth/sign-up/sign-up.test.ts`
  - `app/auth/login/login.test.ts`
  - `app/dashboard/deposit/page.test.tsx`
- Hooks: `{hook-name}.test.tsx`
  - `hooks/use-auth-redirect.test.tsx`
- Layouts: `{layout}.test.tsx`
  - `components/LayoutWrapper.test.tsx`
  - `app/layout.test.tsx`

**Structure:**
```
apps/web/
├── components/
│   ├── food-nft/
│   │   ├── FoodCard.tsx
│   │   └── FoodCard.test.tsx
│   ├── egg-nft/
│   │   ├── EggCard.tsx
│   │   └── EggCard.test.tsx
│   ├── buy-egg/
│   │   ├── BuyEggFlow.tsx
│   │   └── BuyEggFlow.test.tsx
│   ├── auth/
│   │   ├── AuthLink.tsx
│   │   └── AuthLink.test.tsx
│   ├── marketplace/
│   │   ├── MarketplaceFilters.tsx
│   │   └── MarketplaceFilters.test.tsx
│   ├── account-modal.test.tsx
│   ├── BottomNavMobile.test.tsx
│   ├── SideNav.test.tsx
│   └── TopNav.test.tsx
├── app/
│   ├── page.test.tsx
│   ├── layout.test.tsx
│   ├── auth/
│   │   ├── callback/page.test.tsx
│   │   ├── login/login.test.ts
│   │   ├── line/line.test.ts
│   │   └── sign-up/sign-up.test.ts
│   ├── join/page.test.tsx
│   └── dashboard/
│       ├── page.test.tsx
│       └── deposit/page.test.tsx
└── hooks/
    └── use-auth-redirect.test.tsx
```

**Current Test Count:** 17 `.test.tsx` and `.test.ts` files in frontend

### Smart Contracts

**Location:**
- `contracts/test/` directory

**Naming:**
- Unit tests: `{ContractName}.t.sol`
  - `EggNFT.t.sol`
  - `FoodNFT.t.sol`
  - `AnimalNFT.t.sol`
  - `EggFeeding.t.sol`
  - `EggUpgrading.t.sol`
  - `EggHatching.t.sol`
  - `AnimalBreeding.t.sol`
  - `CommissionDistribution.t.sol`
  - `MockUSDT.t.sol`
- Integration tests: `{Feature}AnvilIntegration.t.sol`
  - `EggFeedingAnvilIntegration.t.sol`
  - `FoodNFTAnvilIntegration.t.sol`
  - `AnvilIntegration.t.sol`
- Example: `Counter.t.sol`

**Structure:**
```
contracts/test/
├── EggNFT.t.sol
├── FoodNFT.t.sol
├── AnimalNFT.t.sol
├── EggFeeding.t.sol
├── EggUpgrading.t.sol
├── EggHatching.t.sol
├── AnimalBreeding.t.sol
├── CommissionDistribution.t.sol
├── Counter.t.sol
├── MockUSDT.t.sol
├── EggFeedingAnvilIntegration.t.sol
├── FoodNFTAnvilIntegration.t.sol
└── AnvilIntegration.t.sol
```

**Current Test Count:** 13 `.t.sol` files in contracts

### Wallet API

**Location:**
- Root directory

**Naming:**
- `{name}.test.js` or `{name}.test.ts`
  - `wallet.test.ts`
  - `health.test.js`

### Integration Tests

**Location:**
- `tests/integration/`

**Structure:**
```
tests/integration/
└── tools/
    ├── auth-tools.e2e.test.ts
    ├── collection-tools.e2e.test.ts
    ├── debug-tools.e2e.test.ts
    ├── development-tools.e2e.test.ts
    ├── record-tools.e2e.test.ts
    └── storage-tools.e2e.test.ts
```

## Test Structure

### Frontend Component Tests

**Pattern (RED Phase - Test First):**
```typescript
/**
 * ComponentName Component Tests - RED Phase
 * These tests should FAIL because the component doesn't exist yet.
 * When the component is implemented, tests should pass.
 */

import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}))

// Mock pocketbase client
vi.mock('@/lib/pocketbase/client', () => ({
  createClient: () => ({
    authStore: {
      token: 'mock-token-123',
      record: {
        id: 'user-123',
        wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE7a',
        name: 'Test User',
      },
    },
  }),
  getUser: () => ({...}),
}))

vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: () => true,
}))

describe('ComponentName', () => {
  beforeEach(() => {
    mockPush.mockClear()
    global.fetch = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })
  })

  it('renders component when isOpen is true', async () => {
    const { ComponentName } = await import('@/components/component-name')
    render(<ComponentName isOpen={true} onClose={() => {}} />)
    expect(screen.getByText(/Expected Text/)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const { ComponentName } = await import('@/components/component-name')
    const onClose = vi.fn()
    render(<ComponentName isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('handles user interaction', async () => {
    const { ComponentName } = await import('@/components/component-name')
    render(<ComponentName isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /action/i }))
    expect(mockPush).toHaveBeenCalledWith('/expected/path')
  })

  it('copies to clipboard when copy button clicked', async () => {
    const { ComponentName } = await import('@/components/component-name')
    render(<ComponentName isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'expected-value'
    )
  })

  it('does not render when isOpen is false', async () => {
    const { ComponentName } = await import('@/components/component-name')
    const { container } = render(
      <ComponentName isOpen={false} onClose={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })
})
```

**Example (`FoodCard.test.tsx`):**
```typescript
import { test, expect } from 'bun:test'
import { FoodCard } from './FoodCard'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

test('renders FoodCard with grain type', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: false,
    minted_at: '2024-01-01T00:00:00Z',
  }

  render(<FoodCard food={food} />)
  
  expect(screen.getByText('Food #1')).toBeInTheDocument()
  expect(screen.getByText('🌾 Grain')).toBeInTheDocument()
})

test('shows consumed badge when food is consumed', () => {
  const food = {
    food_id: 1,
    token_id: 1,
    food_type: 'grain' as const,
    is_consumed: true,
    minted_at: '2024-01-01T00:00:00Z',
  }

  render(<FoodCard food={food} />)
  
  expect(screen.getByText('Consumed')).toBeInTheDocument()
})
```

### Page Tests (File Content Assertions)

**Pattern:**
```typescript
import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Page Name', () => {
  const filePath = join(process.cwd(), 'app/route/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('does NOT contain unwanted feature', () => {
    expect(content).not.toContain('unwantedPattern')
  })

  it('contains required feature', () => {
    expect(content).toContain('requiredPattern')
    expect(content).toContain('/required/route')
  })

  it('has correct imports', () => {
    expect(content).toContain('requiredImport')
    expect(content).not.toContain('unwantedImport')
  })

  it('has correct structure', () => {
    expect(content).toContain('export default function')
    expect(content).toContain('use client')
  })
})
```

**Example (`sign-up.test.ts`):**
```typescript
import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Sign-up Page - LINE OAuth Only', () => {
  const filePath = join(process.cwd(), 'app/auth/sign-up/page.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('does NOT contain email state', () => {
    expect(content).not.toContain('useState(\'\')')
    expect(content).not.toContain('setEmail')
  })

  it('does NOT contain Turnstile import', () => {
    expect(content).not.toContain('@marsidev/react-turnstile')
    expect(content).not.toContain('Turnstile')
  })

  it('contains LINE sign-up button', () => {
    expect(content).toContain('SIGN UP WITH LINE')
    expect(content).toContain('/auth/line')
  })

  it('has correct title', () => {
    expect(content).toContain('CREATE ACCOUNT')
    expect(content).toContain('JOIN EGGOWORLD WITH LINE')
  })

  it('uses correct layout', () => {
    expect(content).toContain('LayoutWithoutNav')
    expect(content).toContain('AuthLink')
  })
})
```

### Smart Contract Tests

**Pattern:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Contract} from "../src/Contract.sol";

contract ContractTest is Test {
    Contract public contract;
    
    address public owner;
    address public user;
    
    event EventName(uint256 indexed id, address indexed user);
    
    function setUp() public {
        owner = address(this);
        user = address(0x1);
        
        contract = new Contract();
    }
    
    function test_Deployment() public {
        assertEq(contract.owner(), owner);
    }
    
    function test_Function() public {
        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit EventName(1, user);
        
        contract.functionName();
        
        assertEq(contract.value(), expected);
    }
    
    function test_RevertOnInvalidInput() public {
        vm.expectRevert("Error message");
        contract.invalidFunction();
    }
}
```

**Example (`EggNFT.t.sol`):**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EggNFT} from "../src/EggNFT.sol";
import {CommissionDistribution} from "../src/CommissionDistribution.sol";
import {MockUSDT} from "./MockUSDT.sol";

contract EggNFTTest is Test {
    EggNFT public eggNFT;
    CommissionDistribution public commissionDistribution;
    MockUSDT public mockUSDT;
    
    address public owner;
    address public buyer;
    address public referrerG1;
    
    uint256 public constant MINT_PRICE = 25 * 10^18;
    uint256 public constant INITIAL_BALANCE = 1000 * 10^18;
    
    event EggMinted(uint256 indexed egg_id, address indexed buyer, address indexed referrer);
    
    function setUp() public {
        owner = address(this);
        buyer = address(0x1);
        referrerG1 = address(0x2);
        
        mockUSDT = new MockUSDT();
        commissionDistribution = new CommissionDistribution(coinStorReserve);
        eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
        
        commissionDistribution.setEggNFTContract(address(eggNFT));
        
        mockUSDT.mint(buyer, INITIAL_BALANCE);
        vm.deal(address(commissionDistribution), INITIAL_BALANCE);
    }
    
    function test_Deployment() public {
        assertEq(eggNFT.owner(), owner);
        assertEq(eggNFT.mintPrice(), MINT_PRICE);
        assertEq(address(eggNFT.usdtToken()), address(mockUSDT));
    }
    
    function test_MintWithUSDT() public {
        vm.startPrank(buyer);
        mockUSDT.approve(address(eggNFT), MINT_PRICE);
        
        vm.expectEmit(true, true, true, true);
        emit EggMinted(1, buyer, referrerG1);
        
        uint256 tokenId = eggNFT.mintEgg(referrerG1);
        vm.stopPrank();
        
        assertEq(tokenId, 1);
        assertEq(eggNFT.ownerOf(tokenId), buyer);
    }
}
```

**Integration Test Pattern (`EggFeedingAnvilIntegration.t.sol`):**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EggNFT} from "../src/EggNFT.sol";

/// @title EggFeedingAnvilIntegration
/// @notice Full integration test for egg feeding with Anvil fork
contract EggFeedingAnvilIntegrationTest is Test {
    EggNFT public eggNFT;
    
    function setUp() public {
        // Fork mainnet or testnet
        vm.createSelectFork(vm.rpcUrl("bsc"), 12345678);
        
        // Deploy contracts
        eggNFT = new EggNFT(...);
    }
    
    function test_FullFeedingFlow() public {
        // Test complete feeding flow with real contracts
    }
}
```

## Mocking

### Frontend

**What to Mock:**
- External API calls (use `fetch` mocks)
- PocketBase client methods
- Next.js navigation (`next/navigation`)
- Browser APIs (`navigator.clipboard`, `window`)
- Complex dependencies

**What NOT to Mock:**
- shadcn/ui components (render them)
- User interactions (test real behavior)
- React hooks

**Mock Pattern:**
```typescript
import { vi } from 'bun:test'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
}))

// Mock pocketbase client
vi.mock('@/lib/pocketbase/client', () => ({
  createClient: () => ({
    authStore: {
      token: 'mock-token',
      record: {
        id: 'user-123',
        wallet: '0x...',
      },
    },
    collection: vi.fn(),
  }),
  getUser: () => ({
    id: 'user-123',
    wallet: '0x...',
  }),
  isAuthenticated: () => true,
}))

// Mock custom hooks
vi.mock('@/hooks/use-is-hydrated', () => ({
  useIsHydrated: () => true,
}))

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
) as ReturnType<typeof vi.fn>

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('text'),
  },
  writable: true,
})
```

### Smart Contracts

**What to Mock:**
- ERC20 tokens (use `MockUSDT`)
- External contract dependencies
- Chain state with `vm.mockCall()`
- User addresses with `vm.prank()`

**What NOT to Mock:**
- Core business logic
- State changes
- Event emissions

**Mock Contract Pattern:**
```solidity
// Mock ERC20
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// In test
mockUSDT.mint(buyer, INITIAL_BALANCE);
mockUSDT.approve(address(eggNFT), MINT_PRICE);
```

**Forge Cheats:**
```solidity
vm.prank(user)                    // Execute next call as user
vm.startPrank(user)               // Start prank mode
vm.stopPrank()                    // Stop prank mode
vm.expectEmit(...)                // Expect event emission
vm.deal(address, amount)          // Set ETH balance
vm.mockCall(address, data, returnData)  // Mock external call
vm.roll(blockNumber)              // Set block number
vm.warp(timestamp)                // Set timestamp
```

## Fixtures and Factories

### Frontend Test Data

**Pattern:**
```typescript
const mockUser = {
  id: 'user-123',
  wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE7a',
  name: 'Test User',
  email: 'test@example.com',
}

const mockFood = {
  food_id: 1,
  token_id: 1,
  food_type: 'grain' as const,
  is_consumed: false,
  minted_at: '2024-01-01T00:00:00Z',
}

const mockEgg = {
  egg_id: 1,
  owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE7a',
  food_count: 2,
  is_hatched: false,
  rarity_seed: 12345,
}

const mockBalanceResponse = {
  success: true,
  data: {
    usdt_balance: 1500.75,
    withdrawable: 1200.50,
    total_withdrawn: 300.25,
  },
}
```

### Smart Contract Fixtures

**Pattern:**
```solidity
uint256 public constant MINT_PRICE = 25 * 10^18;
uint256 public constant INITIAL_BALANCE = 1000 * 10^18;
uint256 public constant FOOD_PRICE = 50 * 10^18;
uint256 public constant COMMISSION_RATE = 400; // 4%

function setUp() public {
    // Setup test fixtures
    owner = address(this);
    buyer = address(0x1);
    referrerG1 = address(0x2);
    
    // Deploy contracts
    mockUSDT = new MockUSDT();
    commissionDistribution = new CommissionDistribution(coinStorReserve);
    eggNFT = new EggNFT(address(commissionDistribution), address(mockUSDT));
    
    // Configure relationships
    commissionDistribution.setEggNFTContract(address(eggNFT));
    
    // Fund addresses
    mockUSDT.mint(buyer, INITIAL_BALANCE);
    vm.deal(address(commissionDistribution), INITIAL_BALANCE);
}
```

### Phase Test Summaries

**Pattern (`.planning/phases/*/XX-XX-SUMMARY.md`):**
```markdown
## Test Results

- ✅ All tests passing
- ✅ File content assertions verified
- ✅ No unwanted imports/features

**Test Files:**
- `{Component}.test.tsx` - Component rendering

**Coverage:**

```

## Coverage

### Frontend

**View Coverage:**
```bash
cd apps/web
bun run test:coverage
```

**Configuration:**
- No explicit coverage threshold enforced
- Coverage reports generated in `coverage/` directory
- Formats: HTML, text

### Smart Contracts

**View Coverage:**
```bash
cd contracts
forge coverage
```

**Report Format:**
- Table output in terminal
- Line, branch, and function coverage
- LCOV report for CI integration

**Example Output:**
```
| File            | Line % | Branch % | Function % |
|-----------------|--------|----------|------------|
| EggNFT.sol      | 95.2%  | 88.9%    | 100.0%     |
| FoodNFT.sol     | 92.1%  | 85.7%    | 100.0%     |
| TOTAL           | 93.7%  | 87.3%    | 100.0%     |
```

## Test Types

### Unit Tests

**Frontend:**
- Component rendering tests
- Function logic tests
- Hook behavior tests
- State management tests

**Smart Contracts:**
- Individual function tests
- State change tests
- Event emission tests
- Revert condition tests

### Integration Tests

**Frontend:**
- Page flow tests (via file content assertions)
- API integration tests (mocked)
- Component interaction tests

**Smart Contracts:**
- Anvil fork tests (`*AnvilIntegration.t.sol`)
- Multi-contract interaction tests
- Full flow tests

**Example (`EggFeedingAnvilIntegration.t.sol`):**
- Tests real blockchain interactions
- Uses Anvil local fork
- Validates end-to-end flows

### E2E Tests

**Status:** Not currently implemented

**Recommendation:** Consider Playwright for critical user flows:
- Login → Dashboard
- Mint Egg NFT
- Feed Egg
- Buy/Sell NFT

## Common Patterns

### Async Testing (Frontend)

```typescript
test('handles async operation', async () => {
  const { findByText } = render(<Component />)
  
  const result = await findByText('Loaded')
  expect(result).toBeInTheDocument()
})

test('fetches data on mount', async () => {
  render(<Component />)
  
  const data = await screen.findByText(/dataloaded/i)
  expect(data).toBeInTheDocument()
})
```

### Error Testing

**Frontend:**
```typescript
test('shows error on failure', async () => {
  global.fetch = vi.fn(() =>
    Promise.reject(new Error('Network error'))
  )
  
  render(<Component />)
  
  const error = await findByText('Operation failed')
  expect(error).toBeInTheDocument()
})

test('handles validation error', async () => {
  const { container } = render(<Component />)
  const input = container.querySelector('input')
  
  fireEvent.blur(input!)
  
  expect(screen.getByText('Required field')).toBeInTheDocument()
})
```

**Smart Contracts:**
```solidity
function test_RevertOnInvalidInput() public {
    vm.expectRevert("Error message");
    contract.invalidFunction();
}

function test_RevertWithCustomError() public {
    vm.expectRevert(abi.encodeWithSelector(
        Contract.CustomError.selector,
        param1,
        param2
    ));
    contract.invalidFunction();
}

function test_RevertWhenNotOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(user);
    contract.ownerOnlyFunction();
}
```

### Setup and Teardown

**Frontend:**
```typescript
import { afterEach, beforeEach } from 'bun:test'

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks()
  
  // Reset fetch
  global.fetch = vi.fn()
  
  // Reset mocks
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})

afterEach(() => {
  // Cleanup
  vi.resetModules()
})
```

**Smart Contracts:**
```solidity
function setUp() public {
    // Runs before each test
    // Deploy contracts, setup state
    
    owner = address(this);
    buyer = address(0x1);
    
    // Deploy and configure
    contract = new Contract();
}

function tearDown() public {
    // Cleanup after each test (optional)
    // Usually not needed as setUp runs fresh each time
}
```

## Existing Test Examples

### Frontend Tests

| File | Type | Tests Count |
|------|------|-------------|
| `components/account-modal.test.tsx` | Component | 8 |
| `components/food-nft/FoodCard.test.tsx` | Component | ~8 |
| `components/egg-nft/EggCard.test.tsx` | Component | ~8 |
| `components/buy-egg/BuyEggFlow.test.tsx` | Component | ~6 |
| `components/marketplace/MarketplaceFilters.test.tsx` | Component | ~5 |
| `components/auth/AuthLink.test.tsx` | Component | ~4 |
| `components/LayoutWrapper.test.tsx` | Component | ~4 |
| `components/TopNav.test.tsx` | Component | ~3 |
| `components/SideNav.test.tsx` | Component | ~3 |
| `components/BottomNavMobile.test.tsx` | Component | ~3 |
| `app/page.test.tsx` | Page | ~3 |
| `app/layout.test.tsx` | Layout | ~2 |
| `app/join/page.test.tsx` | Page | ~3 |
| `app/auth/callback/page.test.tsx` | Page | ~4 |
| `app/auth/login/login.test.ts` | Page | ~5 |
| `app/auth/line/line.test.ts` | Page | ~3 |
| `app/auth/sign-up/sign-up.test.ts` | Page | 10 |

### Smart Contract Tests

| File | Type | Coverage |
|------|------|----------|
| `test/EggNFT.t.sol` | Unit | Deployment, minting, properties |
| `test/FoodNFT.t.sol` | Unit | Minting, feeding mechanics |
| `test/AnimalNFT.t.sol` | Unit | Breeding, genetics |
| `test/EggFeeding.t.sol` | Unit | Food consumption logic |
| `test/EggUpgrading.t.sol` | Unit | Rarity upgrades |
| `test/EggHatching.t.sol` | Unit | Hatching mechanics |
| `test/AnimalBreeding.t.sol` | Unit | Breeding logic |
| `test/CommissionDistribution.t.sol` | Unit | Commission calculations |
| `test/MockUSDT.t.sol` | Unit | Token operations |
| `test/Counter.t.sol` | Unit | Basic example |
| `test/EggFeedingAnvilIntegration.t.sol` | Integration | Full feeding flow |
| `test/FoodNFTAnvilIntegration.t.sol` | Integration | Full NFT flow |
| `test/AnvilIntegration.t.sol` | Integration | General integration |

### Wallet API Tests

| File | Type | Tests Count |
|------|------|-------------|
| `wallet-api/wallet.test.ts` | Integration | ~15 |

### Integration Tests (E2E)

| File | Type | Coverage |
|------|------|----------|
| `tests/integration/tools/auth-tools.e2e.test.ts` | E2E | Auth flows |
| `tests/integration/tools/collection-tools.e2e.test.ts` | E2E | Collection operations |
| `tests/integration/tools/debug-tools.e2e.test.ts` | E2E | Debug endpoints |
| `tests/integration/tools/development-tools.e2e.test.ts` | E2E | Dev tools |
| `tests/integration/tools/record-tools.e2e.test.ts` | E2E | Record operations |
| `tests/integration/tools/storage-tools.e2e.test.ts` | E2E | Storage operations |

## Phase Test Documentation

**Pattern (`.planning/phases/NN-feature/NN-XX-*.md`):**
```markdown
## Tests

- [x] Unit tests for {Component}
- [x] File content assertions
- [x] Integration tests

**Test Results:**
```bash
bun run test
```

**Coverage:**

```

## Continuous Integration

**Git Hooks:**
- `husky` installed
- `lint-staged` for pre-commit checks
- `eslint` runs on staged files

**Recommended CI Pipeline:**
```yaml
# Example GitHub Actions
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Run tests
        run: bun run test
        
      - name: Run contract tests
        run: forge test
```

---

*Testing analysis: 2026-04-15*
