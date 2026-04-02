# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Frameworks

### Frontend (Next.js)

**Runner:**
- Bun test (built-in)
- Version: Latest via `@types/bun`

**Assertion Libraries:**
- Bun's built-in `expect()`
- `@testing-library/react@^16.3.2` for component rendering
- `@testing-library/jest-dom@^6.9.1` for DOM matchers

**Configuration:**
- No explicit config file needed
- Uses Bun's default test runner

**Run Commands:**
```bash
cd apps/web
bun run test              # Run all tests
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage
```

### Smart Contracts (Foundry)

**Runner:**
- Forge test (Foundry)
- Solidity version: `0.8.24`

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
forge test              # Run all tests
forge test -vvv         # Verbose output
forge test --match-test testName  # Specific test
forge coverage          # Coverage report
```

### Wallet API

**Runner:**
- Bun test
- Simple unit tests

**Run Commands:**
```bash
cd wallet-api
bun test
```

## Test File Organization

### Frontend

**Location:**
- Co-located with source files
- Same directory as component/page

**Naming:**
- Components: `{ComponentName}.test.tsx`
- Pages: `{page-name}.test.ts`
- Example: `FoodCard.test.tsx`, `sign-up.test.ts`

**Structure:**
```
apps/web/
├── components/
│   ├── food-nft/
│   │   ├── FoodCard.tsx
│   │   └── FoodCard.test.tsx
│   └── egg-nft/
│       ├── EggCard.tsx
│       └── EggCard.test.tsx
└── app/
    └── auth/
        ├── sign-up/
        │   ├── page.tsx
        │   └── sign-up.test.ts
        └── login/
            ├── page.tsx
            └── login.test.ts
```

### Smart Contracts

**Location:**
- `contracts/test/` directory

**Naming:**
- `{ContractName}.t.sol`
- Example: `EggNFT.t.sol`, `FoodNFT.t.sol`, `AnimalBreeding.t.sol`

**Integration Tests:**
- `{Feature}AnvilIntegration.t.sol` for Anvil fork tests
- Example: `EggFeedingAnvilIntegration.t.sol`

### Wallet API

**Location:**
- Root directory
- `{name}.test.js`
- Example: `health.test.js`

## Test Structure

### Frontend Component Tests

**Pattern:**
```typescript
import { test, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Component } from './Component'

test('renders Component with props', () => {
  const props = {
    // Mock props
  }

  render(<Component {...props} />)
  
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
  expect(screen.getByLabelText(/label/i)).toBeInTheDocument()
})

test('handles user interaction', () => {
  const mockCallback = jest.fn()
  render(<Component onSelect={mockCallback} />)
  
  const button = screen.getByRole('button')
  button.click()
  
  expect(mockCallback).toHaveBeenCalledTimes(1)
})

test('shows conditional rendering', () => {
  render(<Component disableSelection />)
  
  expect(screen.queryByLabelText(/select/i)).not.toBeInTheDocument()
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
    
    function test_FoodCountIncrement() public {
        // Test food count mechanics
    }
}
```

**Mock Contract (`MockUSDT.sol`):**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

## Mocking

### Frontend

**What to Mock:**
- External API calls (use `fetch` mocks)
- PocketBase client methods
- Complex dependencies

**What NOT to Mock:**
- shadcn/ui components (render them)
- User interactions (test real behavior)

**Pattern:**
```typescript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: {} })
  })
) as jest.Mock
```

### Smart Contracts

**What to Mock:**
- ERC20 tokens (use `MockUSDT`)
- External contract dependencies
- Chain state with `vm.mockCall()`

**Pattern:**
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
vm.prank(user)           // Execute next call as user
vm.startPrank(user)      // Start prank mode
vm.stopPrank()           // Stop prank mode
vm.expectEmit(...)       // Expect event
vm.deal(address, amt)    // Set ETH balance
vm.mockCall(...)         // Mock external call
```

## Fixtures and Factories

### Frontend Test Data

**Pattern:**
```typescript
const mockFood = {
  food_id: 1,
  token_id: 1,
  food_type: 'grain' as const,
  is_consumed: false,
  minted_at: '2024-01-01T00:00:00Z',
}

const mockEgg = {
  egg_id: 1,
  owner: '0x...',
  food_count: 2,
  is_hatched: false,
  rarity_seed: 12345,
}
```

### Smart Contract Fixtures

**Pattern:**
```solidity
uint256 public constant MINT_PRICE = 25 * 10^18;
uint256 public constant INITIAL_BALANCE = 1000 * 10^18;

function setUp() public {
    // Setup test fixtures
    owner = address(this);
    buyer = address(0x1);
    
    // Deploy contracts
    mockUSDT = new MockUSDT();
    eggNFT = new EggNFT(...);
    
    // Fund addresses
    mockUSDT.mint(buyer, INITIAL_BALANCE);
}
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

### Smart Contracts

**View Coverage:**
```bash
cd contracts
forge coverage
```

**Report Format:**
- Table output in terminal
- Line, branch, and function coverage

## Test Types

### Unit Tests

**Frontend:**
- Component rendering tests
- Function logic tests
- Hook behavior tests

**Smart Contracts:**
- Individual function tests
- State change tests
- Event emission tests

### Integration Tests

**Frontend:**
- Page flow tests (via file content assertions)
- API integration tests

**Smart Contracts:**
- Anvil fork tests (`*AnvilIntegration.t.sol`)
- Multi-contract interaction tests

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

## Common Patterns

### Async Testing (Frontend)

```typescript
test('handles async operation', async () => {
  const { findByText } = render(<Component />)
  
  const result = await findByText('Loaded')
  expect(result).toBeInTheDocument()
})
```

### Error Testing

**Frontend:**
```typescript
test('shows error on failure', async () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network error'))
  )
  
  render(<Component />)
  
  const error = await findByText('Operation failed')
  expect(error).toBeInTheDocument()
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
        Contract.CustomError.selector
    ));
    contract.invalidFunction();
}
```

### Setup and Teardown

**Frontend:**
```typescript
import { afterEach } from 'bun:test'

afterEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})
```

**Smart Contracts:**
```solidity
function setUp() public {
    // Runs before each test
    // Deploy contracts, setup state
}
```

## Existing Test Examples

### Frontend Tests

| File | Type | Coverage |
|------|------|----------|
| `components/food-nft/FoodCard.test.tsx` | Component | 8 tests |
| `components/egg-nft/EggCard.test.tsx` | Component | Similar pattern |
| `app/auth/sign-up/sign-up.test.ts` | Page | 10 tests |
| `app/auth/login/login.test.ts` | Page | Similar pattern |
| `app/auth/line/line.test.ts` | Page | Similar pattern |

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
| `test/EggFeedingAnvilIntegration.t.sol` | Integration | Full feeding flow |
| `test/FoodNFTAnvilIntegration.t.sol` | Integration | Full NFT flow |
| `test/AnvilIntegration.t.sol` | Integration | General integration |
| `test/Counter.t.sol` | Unit | Basic example |

### Wallet API Tests

| File | Type | Coverage |
|------|------|----------|
| `health.test.js` | Unit | Basic health check |

---

*Testing analysis: 2026-04-02*
