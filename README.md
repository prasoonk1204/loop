# Loop — Rotating Savings on Stellar

Loop is a trustless ROSCA (Rotating Savings and Credit Association) platform built on Stellar Soroban. Members pool XLM each cycle; the full pot rotates to one recipient per cycle until everyone has received. No middlemen, no custodians — all escrow logic lives on-chain.


## Quick Nav

- [Important Links & Deployed Contracts](#important-links--deployed-contracts)
- [Screenshots](#screenshots)
- [Features](#features)
- [Future Roadmap](#future-roadmap)
- [Architecture](#architecture)
- [User Feedback Implemented](#user-feedback-implemented)
- [Installation & Local Setup](#installation--local-setup)
- [Smart Contract Development](#smart-contract-development)
- [CI/CD](#cicd)
- [Contributing](#contributing)

---

## Important Links & Deployed Contracts

| Resource | Link |
|---|---|
| Live dApp | [loop-stellar.vercel.app](https://loop-stellar.vercel.app) |
| Demo Video | [Watch on youtube](https://youtu.be/P-EAgVsGwMY) |
| Circle Factory | [`CBPQP7IAZTMUL6YXFBH3Z5ANR663G3YOQG4CWP2TUSGSDOOM5N5AV5GW`](https://stellar.expert/explorer/testnet/contract/CBPQP7IAZTMUL6YXFBH3Z5ANR663G3YOQG4CWP2TUSGSDOOM5N5AV5GW) |
| Pool Contract (example circle) | [`CAT3DNIAOEH7KYE5WB4UPKSETDUO33BQ6EI7ZQXQIU4NSE2KPFXQTLJW`](https://stellar.expert/explorer/testnet/contract/CAT3DNIAOEH7KYE5WB4UPKSETDUO33BQ6EI7ZQXQIU4NSE2KPFXQTLJW) |
| Member Registry (same circle) | [`CANYQ4EUAJC43RJAF5QIMAT2OVYEUAOIBM7EP6EV62WMWLMSFXRCRO4A`](https://stellar.expert/explorer/testnet/contract/CANYQ4EUAJC43RJAF5QIMAT2OVYEUAOIBM7EP6EV62WMWLMSFXRCRO4A) |
| SAC Token | [`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |
| Verifiable Transaction (3rd-cycle payout) | [`54b756db…0f1edc`](https://stellar.expert/explorer/testnet/tx/54b756ad473fc4457edef4db6ca5f09b77ca1ffee988609dc9a11c575b0f1edc) |

---

## Screenshots

### Landing

![Home](public/screenshots/home.png)

### Dashboard

![Dashboard](public/screenshots/dashboard.png)

### Create Circle

![Create Circle](public/screenshots/create-circle.png)

### Mobile Responsiveness

<table>
  <tr>
    <td><img src="public/screenshots/mobile-1.png" alt="Mobile 1" /></td>
    <td><img src="public/screenshots/mobile-2.png" alt="Mobile 2" /></td>
  </tr>
</table>

### Analytics Dashboard

![Analytics](public/screenshots/analytics.png)

### Testnet Transaction

![Testnet Transaction](public/screenshots/testnet.png)

### Tests passing

![Vitest](public/screenshots/tests.png)

### CI/CD

![CI/CD](public/screenshots/cicd.png)

---

## Features

- **Soroban smart contracts** — all fund escrow, contribution tracking, and payout logic runs on-chain. No admin keys, no multisig.
- **Deterministic payout order** — recipient sequence is locked at circle creation. No randomness, no disputes.
- **Creator-defined membership** — the circle creator sets the member list and contribution amount before any funds move.
- **Multi-wallet support** — connect with Freighter, Lobstr, xBull, or any wallet supported by Stellar Wallets Kit.
- **Live activity log** — contributions and payouts surface in real-time on the dashboard, each linked to its on-chain transaction hash.
- **Leave / delete circle** — non-creator members can leave and receive a refund of their current-cycle contribution. The creator can dissolve the circle entirely and refund all contributors.
- **Dual contract architecture** — a `pool-contract` handles fund flows; a `member-registry` contract independently tracks membership and validates payout recipients, preventing recipient mismatch attacks.
- **Circle factory** — one deployed factory creates independent pool/registry instances and stores their addresses, so multiple circles can run concurrently and remain discoverable from one contract.
- **Wallet-gated dashboard** — the dashboard requires a connected wallet before fetching any on-chain state.
- **Factory-based wallet discovery** — on connect, the app finds the wallet's matching circle from the factory and loads that circle's own pool and registry.
- **Contribution history export** — download the visible All Activity or My Activity records as CSV.
- **Browser notifications** — opt in to notifications when new circle activity is confirmed.
- **FAQ and onboarding guidance** — common questions and first-use wallet guidance are available in the UI.

---

## Monitoring & Analytics

- `/api/health` provides a lightweight uptime check for deployment monitoring.
- `/activity` displays the selected circle's Soroban events.
- `/analytics` reads the factory circle list and aggregates activity from every factory-managed pool without requiring a wallet. Activity loads 15 events per page with a Load more control.
- This is on-chain activity, not external product analytics.

## Circle Discovery

The frontend uses `NEXT_PUBLIC_SOROBAN_FACTORY_CONTRACT_ID` as the source of truth for circle discovery. On wallet connect, it reads the factory circle list, checks each pool's `get_members()` result for an exact wallet-address match, and loads the matching pool and registry. The configured pool and registry IDs are not used as dashboard fallbacks.

A wallet that is already found in a factory-managed circle cannot create another circle until it leaves the current one. A wallet with no matching membership sees an empty dashboard and can create a new circle through the factory.

## Future Roadmap

- **Scheduled automatic payouts** — trigger payout via a Stellar ledger time condition instead of requiring manual invocation.
- **Circle invitations** — off-chain invite links that add a member's key to a pending circle before deployment.
- **Background push notifications** — deliver alerts when the app is closed, beyond the current in-app browser notification support.
- **Mobile-first PWA** — installable progressive web app with deep-link support for wallet signing flows.
- **Mainnet support** — configuration toggle to switch from Testnet to Mainnet with appropriate safety warnings.

---

## Architecture

Loop is split into two layers: a Next.js frontend and three Soroban smart contracts. They interact exclusively through signed Stellar transactions — no backend, no database. The factory records every created pool and registry pair in one on-chain list. Each circle has its own isolated pool and member-registry contracts.

### Frontend

The app shell (`layout.tsx`) handles wallet connection via Stellar Wallets Kit and exposes a React context (`circle-context.tsx`) that holds all runtime state — connected wallet, circle membership, contribution status, and transaction history. Every component reads from and writes to this context. On-chain reads use `simulateTransaction` (no fees, no signing); writes go through the full sign → submit → poll confirmation flow.

### Smart contracts

The factory creates and tracks independent circle instances. Each instance uses a pool and registry contract working in tandem:

**Pool Contract** is the escrow engine. It holds contributed XLM, tracks which members have paid in each cycle, and releases the full pot to the recipient when all contributions are present. It never decides the recipient on its own.

**Member Registry** is the source of truth for membership order. When a payout is triggered, the pool contract calls `get_next_recipient` on the registry and compares the result against its own calculated index. If they disagree, the payout panics. This dual-check prevents recipient manipulation if the on-chain member list were somehow modified.

```
Browser
  └── Stellar Wallets Kit ──► sign transaction
        │
        ▼
  Soroban RPC (simulateTransaction / sendTransaction)
        │
        ├── Circle Factory
        │     └── tracks independent Pool + Registry pairs
        │
        ├── Pool Contract
        │     ├── create_circle
        │     ├── contribute      ──► holds XLM in escrow
        │     └── payout          ──► cross-checks with Registry
        │                                    │
        └── Member Registry  ◄───────────────┘
              ├── get_next_recipient
              └── mark_paid
```

### State lifecycle

1. **Connect** — Wallets Kit opens the auth modal; Horizon returns the current XLM balance.
2. **Create circle** — frontend calls the factory, which deploys and records a fresh pool/registry pair for the circle.
3. **Contribute** — each member signs `contribute(member, cycle_id)`; XLM moves from the member's account to the pool contract address.
4. **Payout** — any member calls `payout(cycle_id)`; pool verifies all contributions, cross-checks the registry, transfers the full pot.
5. **Next cycle** — dashboard re-fetches state via read-only simulate calls; cycle counter increments automatically.

---

## User Feedback Implemented

| Feedback | Change | Commit | Representative wallet evidence |
|---|---|---|---|
| Improve mobile responsiveness. | Reduced mobile page padding, kept controls flexible, and improved small-screen layouts. | [`e50ddfa`](https://github.com/prasoonk1204/loop/commit/e50ddfa0c7d6990d27a037ace250b3b1b9a05a5f) | `GCGCFF3YNWZYAUP2KULVPNALTBQKQGBDQHOBSLJRV2F5JOAIOSDGWM2L` |
| Add onboarding guidance for first-time wallet users. | Added three-step guidance to disconnected dashboard state. | [`e50ddfa`](https://github.com/prasoonk1204/loop/commit/e50ddfa0c7d6990d27a037ace250b3b1b9a05a5f) | `GBZOOB75QVA2S2FWMJDWIYDQPXF6TKL5OJKMEIR3MVNQ5RFKLKJBCSFN` |
| I cannot see my personal contributions. | Added All Activity and My Activity tabs with wallet-specific filtering. | [`eecf8f3`](https://github.com/prasoonk1204/loop/commit/eecf8f3b8ee25b253cd69145c8d66d3169559d56) | `GBSPA4R3LLIWZZOV4LJ6GBKD6GPNCUCNTCIP5FKAUHFO5N6SKWUKDEDI` |
| Show clearer transaction status while creating a circle. | Added inline creating status while wallet requests and on-chain confirmations complete. | [`cbc0908`](https://github.com/prasoonk1204/loop/commit/cbc0908ab6e7006d0b694d0f67141661028a35fb) | `GBAQYA36CPBOJAETSSAXRYYXYUHTC3EXZ5R4Z2NPWXO7WGC7O4WBQOJ6` |
| Explain what happens when a member misses a contribution. | Added contract behavior: payout stays locked; leave and delete refund rules are explained. | [`0b79a06`](https://github.com/prasoonk1204/loop/commit/0b79a06f3a0a4e80e4cc4e53c56b4c5e135f2d9c) | `GCRZFG2VFVFRP5454SMUETCNXHWI2DIMVTPF7YAHCCKQTVV64VXLEAIO` |
| Make wallet addresses easier to identify. | Personal addresses display as You in activity entries. | [`eecf8f3`](https://github.com/prasoonk1204/loop/commit/eecf8f3b8ee25b253cd69145c8d66d3169559d56) | `GB4V5ANXTDQE456WI7OXRNNAQWITV5KVWSVJVFQD3PKYVOUYIIYL7SQH` |
| Form errors are easy to miss. | Added inline field and form validation messages on circle creation. | [`cbc0908`](https://github.com/prasoonk1204/loop/commit/cbc0908ab6e7006d0b694d0f67141661028a35fb) | `GD5CKSKAABYTZGYN3GDC43MSR3ER6TUOBSHPJYLRCNLSZGKYUGSK5YDZ` |
| Add retry buttons when blockchain data fails to load. | Added a Try again action when dashboard Soroban reads fail. | [`0b79a06`](https://github.com/prasoonk1204/loop/commit/0b79a06f3a0e4e80e4cc4e53c56b4c5e135f2d9c) | `GD2CBSXPJQZQBEVEF5ZQ5A35RHIULD2R4AA2A2WT732ERUKZ33PWILCZ` |
| Dialogs feel disconnected from the page. | Added consistent confirmation dialog for leaving or deleting a circle. | [`e50ddfa`](https://github.com/prasoonk1204/loop/commit/e50ddfa0c7d6990d27a037ace250b3b1b9a05a5f) | `GCDWNIMNSJZYYDYPLTQRWLUWZ3PIARX6A4FILC3R5EU2APZNBDSQKO32` |
| Empty pages do not tell me what to do next. | Added next-step buttons for empty contract and personal activity views. | [`0b79a06`](https://github.com/prasoonk1204/loop/commit/0b79a06f3a0e4e80e4cc4e53c56b4c5e135f2d9c) | `GCDF44RPW43IMGGHTHDQS5UAUOYPR2QK3WGNROIAO2FECSAEPFFMWMCA` |

### Feedback Summary

Feedback focused mostly on clarity and confidence during wallet and contract interactions. Users wanted better mobile support, clearer onboarding, personal contribution history, and clearer loading and transaction states. They also asked for better missed-payment explanations, easier wallet identification, useful empty states, retry actions, and consistent dialogs. These changes were implemented and checked against wallet activity on Stellar testnet.

---

## Installation & Local Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- A Stellar testnet wallet (Freighter recommended)
- Testnet XLM from [friendbot](https://friendbot.stellar.org)

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/loop.git
cd loop

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
```

Edit `.env` and fill in your deployed contract IDs:

```env
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org/

NEXT_PUBLIC_SOROBAN_FACTORY_CONTRACT_ID=<your circle factory contract ID>
NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID=<your SAC token contract ID>
```

```bash
# 4. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:ci` | Run Vitest once (CI mode) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type-check |

---

## Smart Contract Development

### Stack

- Rust (edition 2024)
- `soroban-sdk` v27.0.0
- Target: `wasm32v1-none`

### Contracts

**`pool-contract`** — core ROSCA logic.

| Function | Description |
|---|---|
| `initialize(token, registry)` | One-time setup, links token and registry contracts |
| `create_circle(members, amount, length)` | Deploy a new circle with member list and contribution amount |
| `contribute(member, cycle_id)` | Transfer `amount` XLM from member to contract escrow |
| `payout(cycle_id)` | Release full pot to the cycle's recipient once all members have contributed |
| `leave_circle(caller)` | Member exits; current-cycle contribution refunded if already paid |
| `delete_circle(caller)` | Creator dissolves circle; all current-cycle contributions refunded |
| `get_members / get_contribution_amount / get_cycle_length` | Read-only getters |
| `is_contributed(cycle_id, member)` | Check if a member has contributed in a given cycle |
| `is_cycle_paid(cycle_id)` | Check if a cycle has already been paid out |

**`member-registry`** — independent membership and recipient validation.

| Function | Description |
|---|---|
| `register_members(members)` | Store the ordered member list |
| `get_next_recipient(cycle_id)` | Return `members[cycle_id % len]` |
| `mark_paid(cycle_id, member)` | Record a completed payout |
| `remove_member(caller)` | Remove a member from the registry |
| `reset_registry(caller)` | Clear the member list (used before creating a new circle) |

### Running contract tests

```bash
cd contracts
cargo test --workspace
```

9 test cases covering:

- Full happy-path cycle (all members contribute → payout → correct recipient)
- Correct payout amount calculation
- Payout recipient rotation across multiple cycles
- Rejection of payout when contributions are missing
- Rejection of recipient mismatch between pool and registry
- Double-contribution prevention
- Contribution to an already-closed cycle
- Empty member list rejection
- Single-member circle (contributes to itself)

### Building WASM

```bash
cd contracts
cargo build --target wasm32v1-none --release
```

---

## CI/CD

GitHub Actions runs four jobs on every push to `main` / `dev` and every PR targeting `main`:

| Job | What it does |
|---|---|
| **Soroban Contract Tests** | Installs Rust stable + `wasm32v1-none` target, runs `cargo test --workspace` with Cargo cache |
| **Frontend Tests (Vitest)** | Sets up Node 20 + pnpm 10, installs deps, runs `pnpm test:ci` |
| **Lint & Type-check** | Runs `pnpm lint` (ESLint) then `pnpm typecheck` (tsc --noEmit) |
| **Next.js Build** | Runs after frontend tests and lint pass; executes `pnpm build` and uploads the `.next/` artifact (7-day retention) |

The build job depends on both `frontend-tests` and `lint-typecheck` passing first, so a broken build never reaches production artifacts.

```
push / PR
    │
    ├── contract-tests   (Rust / Soroban)
    ├── frontend-tests   (Vitest)
    └── lint-typecheck   (ESLint + tsc)
                │
                └── build  (Next.js, only if both pass)
```

---

## Contributing

1. Fork the repo and create a branch from `dev`.
2. Make your changes. Run tests before opening a PR:
   ```bash
   pnpm test:ci          # frontend
   cd contracts && cargo test --workspace  # contracts
   pnpm typecheck        # types
   ```
3. Open a PR targeting `dev`. CI must be green before review.
4. Keep PRs focused — one concern per PR makes review faster.

For larger changes, open an issue first to discuss the approach.
