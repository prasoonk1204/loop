import { Horizon, rpc } from "@stellar/stellar-sdk";

export const STELLAR_HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ??
  "https://soroban-testnet.stellar.org/";

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
  "Test SDF Network ; September 2015";

export const horizonServer = new Horizon.Server(STELLAR_HORIZON_URL);
export const rpcServer = new rpc.Server(STELLAR_RPC_URL);

export function nativeBalance(
  balances: Array<{ asset_type?: string; balance: string }>
) {
  return balances.find((balance) => balance.asset_type === "native")?.balance ?? "0";
}

export function formatXlmBalance(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(7).replace(/\.?0+$/, "") : value;
}
