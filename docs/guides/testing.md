# Testing Guide

This guide covers testing strategies and best practices for the EggoWorld project.

## Testing Philosophy

We follow a **pyramid testing approach**:
1. **Unit Tests**: Fast, isolated tests of individual functions
2. **Integration Tests**: Tests of component interactions
3. **End-to-End Tests**: Tests of complete user flows

Our goal is **high test coverage** while maintaining **fast feedback cycles**.

## Testing Technologies

### Backend (PocketBase)
- **Framework**: PocketBase test framework + Bun test
- **Assertions**: Bun assert
- **Coverage**: c8 (Istanbul)

### Frontend (Next.js)
- **Framework**: Jest + React Testing Library
- **Assertions**: Jest expect
- **Coverage**: Istanbul (built into Jest)

### Smart Contracts
- **Framework**: Foundry (Forge)
- **Assertions**: Solidity assert
- **Coverage**: Forge coverage

## Running Tests

### All Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test:coverage

# Run tests in watch mode
bun test:watch
```

### Backend Tests

```bash
cd apps/backend

# Run all backend tests
bun test

# Run specific test file
bun test referrals.test.js

# Run with coverage
bun test --coverage
```

### Frontend Tests

```bash
cd apps/web

# Run all frontend tests
bun test

# Run specific test file
bun test referral-dashboard.test.tsx

# Run with coverage
bun test --coverage
```

### Contract Tests

```bash
cd contracts

# Run all contract tests
forge test

# Run specific test
forge test --match-test testReferralDistribution

# Run with coverage
forge coverage
```

## Writing Tests

### Backend Tests (PocketBase Hooks)

#### Test Structure

```javascript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";

describe("Referral Chain", () => {
  let testUserId;
  let testReferrerId;

  beforeAll(async () => {
    // Setup: Create test users
    testReferrerId = await createTestUser();
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await cleanupTestData();
  });

  describe("buildReferralChain", () => {
    it("should create a 4-level chain for new user", async () => {
      // Arrange
      const referrerId = testReferrerId;

      // Act
      const chain = await buildReferralChain(referrerId);

      // Assert
      expect(chain).toBeDefined();
      expect(chain.g1).toBe(referrerId);
      expect(chain.g2).toBeDefined();
      expect(chain.g3).toBeDefined();
      expect(chain.g4).toBeDefined();
    });

    it("should use platform address when referrer has no chain", async () => {
      // Arrange
      const referrerId = await createTestUserWithoutChain();

      // Act
      const chain = await buildReferralChain(referrerId);

      // Assert
      expect(chain.g1).toBe(referrerId);
      expect(chain.g2).toBe(PLATFORM_ADDRESS);
      expect(chain.g3).toBe(PLATFORM_ADDRESS);
      expect(chain.g4).toBe(PLATFORM_ADDRESS);
    });
  });
});
```

#### Best Practices

1. **Isolation**: Each test should be independent
2. **Setup/Teardown**: Use `beforeAll`/`afterAll` for shared setup
3. **Descriptive Names**: Test names should describe what they test
4. **AAA Pattern**: Arrange, Act, Assert structure
5. **Mock External Services**: Don't make real API calls

### Frontend Tests (React Components)

#### Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "./register-form";

describe("RegisterForm", () => {
  it("should render registration fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("should show error for invalid email", async () => {
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("should call onSuccess when registration succeeds", async () => {
    const onSuccess = jest.fn();
    render(<RegisterForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "SecurePass123!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

#### Best Practices

1. **User-Centric**: Test from user's perspective
2. **Query Selectors**: Use accessible queries (`getByLabelText`)
3. **Async Handling**: Use `waitFor` for async operations
4. **Mock APIs**: Mock PocketBase client calls
5. **Avoid Implementation Details**: Test behavior, not internals

### Contract Tests (Foundry)

#### Test Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NFTMarketplace.sol";

contract NFTMarketplaceTest is Test {
    NFTMarketplace marketplace;
    address owner;
    address user1;
    address user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        marketplace = new NFTMarketplace();
        marketplace.initialize();
    }

    function testPurchaseNFT() public {
        // Arrange
        uint256 price = 25 ether; // 25 USDT
        vm.deal(user1, price);

        // Act
        vm.prank(user1);
        marketplace.purchaseNFT{value: price}(0);

        // Assert
        assertEq(marketplace.ownerOf(0), user1);
    }

    function testRevertWhenInsufficientBalance() public {
        // Arrange
        uint256 price = 25 ether;
        vm.deal(user1, price - 1 ether); // 1 USDT short

        // Act & Assert
        vm.prank(user1);
        vm.expectRevert("Insufficient balance");
        marketplace.purchaseNFT{value: price}(0);
    }

    function testCommissionDistribution() public {
        // Arrange
        uint256 price = 100 ether;
        vm.deal(user2, price);

        address g1 = address(0x10);
        address g2 = address(0x20);
        address g3 = address(0x30);
        address g4 = address(0x40);

        // Act
        vm.prank(user2);
        marketplace.purchaseNFT{value: price}(0);

        // Assert
        assertEq(marketplace.commissionsEarned(g1), 25 ether); // 25%
        assertEq(marketplace.commissionsEarned(g2), 15 ether); // 15%
        assertEq(marketplace.commissionsEarned(g3), 10 ether); // 10%
        assertEq(marketplace.commissionsEarned(g4), 5 ether);  // 5%
    }
}
```

#### Best Practices

1. **Setup in `setUp()`**: Initialize common state
2. **Cheats Codes**: Use `vm.prank`, `vm.deal` for test manipulation
3. **Event Testing**: Verify events are emitted
4. **Revert Testing**: Test failure cases
5. **Fork Testing**: Test against mainnet forks

## Test Coverage Goals

### Minimum Requirements
- **Backend**: 80% code coverage
- **Frontend**: 70% code coverage
- **Contracts**: 90% code coverage

### Critical Paths (100% Coverage)
- User registration and authentication
- Referral chain building
- Commission distribution
- Wallet creation and encryption
- NFT purchases and transfers
- USDT balance updates

## Test Data Management

### Fixtures

Create reusable test data:

```javascript
// apps/backend/tests/fixtures/users.js
export const testUsers = {
  verifiedUser: {
    email: "verified@example.com",
    password: "SecurePass123!",
    verified: true
  },
  unverifiedUser: {
    email: "unverified@example.com",
    password: "SecurePass123!",
    verified: false
  },
  adminUser: {
    email: "admin@example.com",
    password: "AdminPass123!",
    role: "admin"
  }
};
```

### Factories

Create test data factories:

```javascript
// apps/backend/tests/factories/userFactory.js
export function createUser(overrides = {}) {
  return {
    email: `user${Date.now()}@example.com`,
    password: "SecurePass123!",
    verified: false,
    ...overrides
  };
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests

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

      - name: Run backend tests
        run: cd apps/backend && bun test

      - name: Run frontend tests
        run: cd apps/web && bun test

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Run contract tests
        run: cd contracts && forge test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Common Testing Patterns

### Testing Async Operations

```javascript
it("should handle async registration", async () => {
  const result = await registerUser(userData);
  expect(result.success).toBe(true);
});
```

### Testing Error Cases

```javascript
it("should reject duplicate email", async () => {
  await registerUser({ email: "test@example.com" });

  await expect(
    registerUser({ email: "test@example.com" })
  ).rejects.toThrow("Email already exists");
});
```

### Testing with Mocks

```javascript
it("should call PocketBase API", async () => {
  const mockPB = {
    collection: jest.fn().mockReturnThis(),
    create: jest.fn().mockResolvedValue({ id: "123" })
  };

  await registerUser(userData, mockPB);

  expect(mockPB.collection).toHaveBeenCalledWith("users");
  expect(mockPB.create).toHaveBeenCalled();
});
```

## Debugging Tests

### Run Tests in Debug Mode

```bash
# Backend
bun test --inspect-brk

# Frontend
bun test --debug

# Contracts
forge test -vvv
```

### Console Output

```javascript
it("should debug output", () => {
  console.log("Test data:", testData);
  expect(true).toBe(true);
});
```

### Test-Specific Logs

```javascript
describe("Referral Logic", () => {
  beforeEach(() => {
    console.log("Starting referral test...");
  });

  it("should build chain", () => {
    const chain = buildReferralChain("referrer123");
    console.log("Built chain:", chain);
    expect(chain).toBeDefined();
  });
});
```

## Performance Testing

### Load Testing

```javascript
describe("Load Tests", () => {
  it("should handle 100 concurrent registrations", async () => {
    const registrations = Array(100)
      .fill(null)
      .map(() => registerUser(createUser()));

    const results = await Promise.all(registrations);

    expect(results.every(r => r.success)).toBe(true);
  });
});
```

### Stress Testing

```solidity
function testStressLargeCommission() public {
    uint256 largeAmount = 1000000 ether;
    vm.deal(user1, largeAmount);

    vm.prank(user1);
    marketplace.purchaseNFT{value: largeAmount}(0);

    // Verify system handles large amounts
    assertEq(marketplace.commissionsEarned(g1), largeAmount * 25 / 100);
}
```

## Security Testing

### Input Validation

```javascript
it("should reject SQL injection attempts", async () => {
  const maliciousInput = "'; DROP TABLE users; --";

  await expect(
    registerUser({ email: maliciousInput })
  ).rejects.toThrow("Invalid email");
});
```

### Access Control

```solidity
function testOnlyOwnerCanWithdraw() public {
    vm.prank(user1); // Not owner
    vm.expectRevert("Unauthorized");
    marketplace.withdrawPlatformFunds();
}
```

## Testing Checklist

Before committing code, ensure:

- [ ] All tests pass locally
- [ ] New tests are added for new features
- [ ] Coverage has not decreased
- [ ] Tests are deterministic (no random failures)
- [ ] Tests are fast (< 5 seconds per test file)
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] No console errors in tests
- [ ] Tests follow project conventions

## Common Pitfalls

### 1. Testing Implementation Details

❌ Bad:
```javascript
it("should set useState", () => {
  render(<Component />);
  expect(componentState).toBe("value");
});
```

✅ Good:
```javascript
it("should display value to user", () => {
  render(<Component />);
  expect(screen.getByText("value")).toBeInTheDocument();
});
```

### 2. Not Cleaning Up Test Data

❌ Bad:
```javascript
it("should create user", async () => {
  const user = await createUser({ email: "test@example.com" });
  // Test data not cleaned up
});
```

✅ Good:
```javascript
it("should create user", async () => {
  const user = await createUser({ email: "test@example.com" });
  await cleanupUser(user.id);
});
```

### 3. brittle Tests

❌ Bad:
```javascript
it("should match exact snapshot", () => {
  const tree = render(<Component />);
  expect(tree).toMatchSnapshot();
});
```

✅ Good:
```javascript
it("should contain expected elements", () => {
  render(<Component />);
  expect(screen.getByRole("button")).toBeInTheDocument();
});
```

## Resources

- [PocketBase Testing](https://pocketbase.io/docs/testing-overview/)
- [React Testing Library](https://testing-library.com/react)
- [Foundry Testing](https://book.getfoundry.sh/forge/testing)
- [Jest Best Practices](https://jestjs.io/docs/tutorial-react)

## Related Documentation
- `/docs/modules/referrals.md` - Referral testing examples
- `/docs/modules/users.md` - User testing examples
- `/docs/guides/setup.md` - Test environment setup
