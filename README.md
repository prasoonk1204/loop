# Loop

Loop is a Stellar Testnet starter for a rotating savings circle built with Next.js App Router and TypeScript.

## What it does

- Connects through Stellar Wallets Kit
- Supports Freighter, xBull, Lobstr, and other kit-backed wallets
- Shows the connected wallet public key
- Fetches native XLM balance from Horizon Testnet
- Sends XLM from the connected wallet
- Exposes a small Next.js API layer for off-chain logic like webhooks and notifications

## Stack

- Next.js App Router
- TypeScript
- Freighter API
- Stellar Wallets Kit
- `@stellar/stellar-sdk`
- Stellar Testnet

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the app:

```bash
pnpm dev
```

3. Open `http://localhost:3000`

## Environment

The app defaults to Stellar Testnet:

- `NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org`
- `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015`

## Notes

- At least one supported wallet must be installed in the browser.
- The send flow assumes the wallet has Testnet XLM.
- Wallet errors are shown distinctly for:
  - missing wallet
  - rejected transaction
  - insufficient balance
- The API routes are placeholders for future ROSCA off-chain services like webhooks, queues, caching, and notifications.
