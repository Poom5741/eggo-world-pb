# Phase 22: Tier Rewards & Badges - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 22-tier-rewards-badges
**Areas discussed:** Smart Contract Design, Backend Hook & Reward Distribution, Tier Thresholds & Rewards, User Profile Integration, Data Model, Frontend Patterns

---

## Smart Contract Design

| Option               | Description                                     | Selected |
| -------------------- | ----------------------------------------------- | -------- |
| ERC-5192 Soulbound   | Non-transferable badges, permanent achievements | ✓        |
| ERC-721 Transferable | Badges can be traded/sold                       |          |
| ERC-1155 Multi-token | Single contract, multiple badge types           |          |

**User's choice:** ERC-5192 Soulbound standard for permanent achievement markers
**Notes:** Soulbound fits the "achievement" nature of tiers — users earn them through activity, not purchase

---

## Backend Hook Architecture

| Option                 | Description                                     | Selected |
| ---------------------- | ----------------------------------------------- | -------- |
| Multi-layer validation | Hook → wallet-api → contract (defense in depth) | ✓        |
| Hook only              | Simple validation in PocketBase only            |          |
| Direct contract call   | Frontend calls contract directly                |          |

**User's choice:** Multi-layer validation following Phase 20 pattern
**Notes:** Consistent with breeding system approach — validation at every layer

---

## Tier Threshold Structure

| Option                   | Description                             | Selected |
| ------------------------ | --------------------------------------- | -------- |
| Sequential (10/100/1000) | Must claim Seedling before Grower       | ✓        |
| Independent thresholds   | Can skip tiers if threshold high enough |          |
| Dynamic thresholds       | Adjust based on network activity        |          |

**User's choice:** Sequential thresholds as defined in REQUIREMENTS.md
**Notes:** Clear progression arc, simple to understand, matches functional spec

---

## Reward Distribution Source

| Option           | Description                | Selected |
| ---------------- | -------------------------- | -------- |
| CoinStor reserve | Platform treasury wallet   | ✓        |
| Mint new tokens  | Create USDT (not possible) |          |
| User-funded      | Rewards from other users   |          |

**User's choice:** CoinStor reserve (platform treasury)
**Notes:** Matches commission distribution pattern — platform-funded rewards

---

## Frontend Display Location

| Option                | Description                        | Selected |
| --------------------- | ---------------------------------- | -------- |
| Dashboard card        | Alongside balance/eggs/commissions | ✓        |
| Dedicated /tiers page | Separate route for tier system     |          |
| Profile only          | Only in user profile               |          |

**User's choice:** Dashboard card + profile integration
**Notes:** Maximum visibility for tier progression, encourages engagement

---

## Claude's Discretion

- Badge icon design (Material Symbols: sprout, potted_plant, agriculture)
- Progress bar styling (reuse egg feeding pattern)
- Claim modal animation style
- Color scheme for tier badges (claymorphism with tier-specific accents)

## Deferred Ideas

None — discussion stayed within Phase 22 scope.
