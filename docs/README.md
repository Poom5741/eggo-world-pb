# EggoWorld Documentation

Welcome to the EggoWorld project documentation. This documentation is designed to help you understand, develop, and test the EggoWorld platform.

## Quick Start

1. **New to the project?** Start with [Development Setup Guide](guides/setup.md)
2. **Working with AI?** Read [CLAUDE.md](../CLAUDE.md) for AI context
3. **Understanding the architecture?** Check [System Architecture](00-architecture.md)

## Documentation Structure

### Core Documentation

- **[00-architecture.md](00-architecture.md)**: Complete system architecture overview
  - High-level architecture diagram
  - Component breakdown
  - Data flow and integration patterns
  - Security and scalability considerations

- **[01-domain-model.md](01-domain-model.md)**: Business domain and entities
  - Core entities (User, Referral, NFT, Transaction)
  - Entity relationships and value objects
  - Business rules and invariants
  - Domain services and events

- **[02-decisions.md](02-decisions.md)**: Architecture Decision Records (ADRs)
  - Technology choices and rationale
  - Historical decisions and their outcomes
  - Pending and under-review decisions
  - Decision review process

### Module Documentation

- **[modules/referrals.md](modules/referrals.md)**: MLM Referral System
  - 4-level referral chain logic
  - Commission distribution algorithms
  - API endpoints and data models
  - Testing strategies

- **[modules/users.md](modules/users.md)**: User Management
  - Registration and authentication
  - LINE OAuth integration
  - Profile management
  - Wallet integration

- **[modules/egg-nft.md](modules/egg-nft.md)**: Egg NFT System ⭐ NEW
  - Egg NFT minting (25 USDT)
  - Food NFT collection (auto-mint 2 per egg)
  - Hatching mechanism (10 Food → 1 Animal)
  - On-chain commission distribution (20%/10%/10%/10%/4%)
  - Smart contract integration

### Plan Documentation

- **[plan/egg-nft-minting.md](plan/egg-nft-minting.md)**: Egg NFT Implementation Plan
  - Complete feature specification
  - Smart contract requirements
  - Backend integration points
  - Frontend UI/UX design

- **[plan/egg-nft-frontend-guide.md](plan/egg-nft-frontend-guide.md)**: Egg NFT Frontend Guide
  - Visual design system (retro pixel aesthetic)
  - Component hierarchy
  - Page layouts and wireframes
  - Interaction states and animations

### Guides

- **[guides/setup.md](guides/setup.md)**: Development Setup Guide
  - Prerequisites and installation
  - Environment configuration
  - Running services locally
  - Common troubleshooting

- **[guides/testing.md](guides/testing.md)**: Testing Guide
  - Testing philosophy and strategies
  - Backend, frontend, and contract testing
  - CI/CD integration
  - Best practices and patterns

### AI Collaboration Files

- **[../CLAUDE.md](../CLAUDE.md)**: AI Context File
  - Project overview and quick reference
  - Key conventions and patterns
  - Important files and gotchas
  - Development workflow tips

- **[../AGENTS.md](../AGENTS.md)**: AI Agent Instructions
  - Agent capabilities and boundaries
  - Code patterns and procedures
  - Common tasks and debugging
  - Success criteria

## How to Use This Documentation

### For New Developers

1. Start with [Development Setup Guide](guides/setup.md) to get your environment ready
2. Read [System Architecture](00-architecture.md) to understand the big picture
3. Review [Domain Model](01-domain-model.md) to understand business entities
4. Explore module documentation for your specific area
5. Follow [Testing Guide](guides/testing.md) to write tests

### For AI Agents

1. Read [../CLAUDE.md](../CLAUDE.md) for project context
2. Review [../AGENTS.md](../AGENTS.md) for capabilities and procedures
3. Consult module documentation for specific logic
4. Follow code patterns and conventions documented in [ADRs](02-decisions.md)

### For Architects/Designers

1. Review [Architecture Decision Records](02-decisions.md) for rationale
2. Study [System Architecture](00-architecture.md) for design patterns
3. Examine [Domain Model](01-domain-model.md) for business logic
4. Propose new decisions using ADR format

### For QA/Testers

1. Study [Testing Guide](guides/testing.md) for strategies
2. Review module documentation for business logic details
3. Understand [Domain Model](01-domain-model.md) for business rules
4. Write tests following documented patterns

## Documentation Standards

### Writing Style

- **Clear and Concise**: Use simple language, avoid jargon
- **Examples First**: Show code examples before explaining
- **Practical**: Focus on how to do things, not just what
- **Up-to-Date**: Keep documentation in sync with code changes

### Code Examples

All code examples should be:
- **Complete**: Run without modification
- **Annotated**: Explain key parts
- **Real**: Use actual code from the project
- **Tested**: Verify examples actually work

### Diagrams

Use ASCII diagrams for:
- System architecture
- Data flow
- Entity relationships
- Process flows

Example:
```
User → Frontend → Backend → Database
```

## Contributing to Documentation

### When to Update Documentation

Update documentation when you:
- Add new features or modules
- Change existing functionality
- Fix important bugs
- Make architecture decisions
- Learn new patterns or best practices

### How to Update

1. **Choose the right file**:
   - New module? Create `modules/your-module.md`
   - Architecture change? Update `00-architecture.md`
   - Business logic change? Update `01-domain-model.md`
   - New decision? Add to `02-decisions.md`

2. **Follow the template**:
   ```markdown
   # Feature Name

   ## Overview
   Brief description of what this does

   ## Purpose
   Why this exists

   ## Domain Logic
   How it works

   ## API Surface
   Endpoints and interfaces

   ## Dependencies
   What depends on this and what this depends on
   ```

3. **Review and test**:
   - Verify all examples work
   - Check for clarity and completeness
   - Update related documentation
   - Add cross-references

### Documentation Review Checklist

Before submitting documentation changes:

- [ ] All examples are tested and working
- [ ] Cross-references are accurate
- [ ] Code formatting is consistent
- [ ] Spelling and grammar are correct
- [ ] Complex concepts have examples
- [ ] Related files are updated
- [ ] TOC is updated (if needed)

## Finding Information

### By Topic

| Topic | Location |
|-------|----------|
| System overview | [00-architecture.md](00-architecture.md) |
| Business logic | [01-domain-model.md](01-domain-model.md) |
| Referral system | [modules/referrals.md](modules/referrals.md) |
| User management | [modules/users.md](modules/users.md) |
| Testing | [guides/testing.md](guides/testing.md) |
| Setup | [guides/setup.md](guides/setup.md) |
| AI context | [../CLAUDE.md](../CLAUDE.md) |

### By Role

| Role | Recommended Reading |
|------|---------------------|
| New developer | Setup → Architecture → Domain Model → Modules |
| AI Agent | CLAUDE.md → AGENTS.md → Architecture → Modules |
| Architect | Architecture → ADRs → Domain Model |
| QA Engineer | Testing → Domain Model → Modules |

## Documentation Index

### A-Z Index

- **A**: Architecture, ADRs, Authentication
- **C**: Commission Distribution, CI/CD
- **D**: Database, Domain Model, Deployment
- **E**: Environment Setup, Error Handling
- **F**: Frontend, Features
- **I**: Integration, Installation
- **M**: Modules, Monitoring
- **N**: NFTs, Networking
- **P**: Performance, PocketBase
- **R**: Referrals, Registration
- **S**: Security, Scalability, Setup
- **T**: Testing, Transactions
- **U**: Users, UI/UX
- **W**: Wallet, Wallet API

## Keeping Documentation Current

### Review Schedule

- **Weekly**: Quick review of recent changes
- **Monthly**: Comprehensive documentation audit
- **Quarterly**: Major updates and restructuring

### Maintenance Tasks

- [ ] Check for broken links
- [ ] Update code examples
- [ ] Verify all commands work
- [ ] Remove outdated information
- [ ] Add new features and modules
- [ ] Update ADRs with new decisions

## Feedback and Contributions

### Reporting Issues

Found a documentation issue?
1. Check if it's already reported
2. Create an issue with "docs" label
3. Describe the problem clearly
4. Suggest improvements if possible

### Suggesting Improvements

Have ideas for better documentation?
1. Open a discussion or issue
2. Explain what could be improved
3. Provide examples if possible
4. Volunteer to update if willing

## Additional Resources

### External Documentation

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [React Testing Library](https://testing-library.com/react)
- [BSC Documentation](https://docs.bnbchain.org/)

### Internal Resources

- [GitHub Repository](https://github.com/your-org/eggo-pocketbase)
- [Issue Tracker](https://github.com/your-org/eggo-pocketbase/issues)
- [Discussion Forum](https://github.com/your-org/eggo-pocketbase/discussions)

## Quick Reference

### Essential Files

```
eggo-pocketbase/
├── CLAUDE.md                    # AI context (read this first!)
├── AGENTS.md                     # AI agent instructions
├── docs/
│   ├── README.md                 # This file
│   ├── 00-architecture.md        # System architecture
│   ├── 01-domain-model.md        # Domain entities
│   ├── 02-decisions.md           # ADRs
│   ├── modules/
│   │   ├── referrals.md          # Referral system
│   │   └── users.md              # User management
│   └── guides/
│       ├── setup.md              # Development setup
│       └── testing.md            # Testing guide
```

### Key Concepts

- **MLM**: Multi-Level Marketing (4-level referral system)
- **NFT**: Non-Fungible Token (Egg, Food, Animal)
- **USDT**: Tether USD token on BSC (BEP-20)
- **PocketBase**: Go-based backend framework
- **Foundry**: Solidity development framework
- **BSC**: BNB Smart Chain

### Common Commands

```bash
# Start all services
bun dev

# Run tests
bun test

# Build for production
bun build

# Deploy
bun deploy
```

---

**Last Updated**: 2024-03-30
**Documentation Version**: 1.0.0
**Maintained By**: EggoWorld Development Team
