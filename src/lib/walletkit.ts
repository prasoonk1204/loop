import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks, SwkAppDarkTheme } from "@creit.tech/stellar-wallets-kit/types";

let initialized = false;

export function initWalletKit() {
  if (initialized || typeof window === "undefined") return;

  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    theme: SwkAppDarkTheme
  });
  initialized = true;
}

export async function getSupportedWallets() {
  initWalletKit();
  return StellarWalletsKit.refreshSupportedWallets();
}

export function getConnectedWalletName() {
  try {
    return StellarWalletsKit.selectedModule.productName;
  } catch {
    return "";
  }
}
