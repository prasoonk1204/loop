"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  Asset,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  STELLAR_NETWORK_PASSPHRASE,
  formatXlmBalance,
  horizonServer,
  nativeBalance
} from "@/lib/stellar";
import {
  getConnectedWalletName,
  getSupportedWallets,
  initWalletKit
} from "@/lib/walletkit";

type SendState = {
  kind: "idle" | "loading" | "success" | "error";
  message: string;
  hash?: string;
};

function walletLabel(name: string) {
  return name || "Wallet";
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown wallet error";
}

function isTxRejected(error: unknown) {
  const message = toMessage(error).toLowerCase();
  const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : undefined;
  return code === -1 || message.includes("closed the modal") || message.includes("reject") || message.includes("cancel");
}

function isInsufficientBalance(error: unknown) {
  const message = toMessage(error).toLowerCase();
  const response = error as {
    response?: { data?: { extras?: { result_codes?: { transaction?: string } } } };
  };
  const transactionCode = response.response?.data?.extras?.result_codes?.transaction;

  return transactionCode === "tx_insufficient_balance" || message.includes("tx_insufficient_balance");
}

export function WalletDashboard() {
  const [publicKey, setPublicKey] = useState("");
  const [walletName, setWalletName] = useState("");
  const [balance, setBalance] = useState("0");
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");
  const [supportedWallets, setSupportedWallets] = useState<string[]>([]);
  const [sendState, setSendState] = useState<SendState>({
    kind: "idle",
    message: ""
  });

  const connected = Boolean(publicKey);
  const balanceLabel = useMemo(() => formatXlmBalance(balance), [balance]);

  useEffect(() => {
    initWalletKit();
    void (async () => {
      const wallets = await getSupportedWallets();
      setSupportedWallets(wallets.filter((wallet) => wallet.isAvailable).map((wallet) => wallet.name));
    })();
  }, []);

  async function refreshBalance(address: string) {
    const account = await horizonServer.loadAccount(address);
    setBalance(nativeBalance(account.balances));
  }

  async function connectWallet() {
    setLoadingWallet(true);
    setSendState({ kind: "idle", message: "" });

    try {
      const wallets = await getSupportedWallets();
      const availableWallets = wallets.filter((wallet) => wallet.isAvailable);
      setSupportedWallets(availableWallets.map((wallet) => wallet.name));

      if (!availableWallets.length) {
        setSendState({
          kind: "error",
          message: "Wallet not found. Install Freighter, xBull, or another supported Stellar wallet."
        });
        return;
      }

      const { address } = await StellarWalletsKit.authModal();
      if (!address) {
        throw new Error("Wallet did not return an address");
      }

      setPublicKey(address);
      setWalletName(walletLabel(getConnectedWalletName()));
      await refreshBalance(address);
    } catch (error) {
      setSendState({
        kind: "error",
        message: toMessage(error)
      });
    } finally {
      setLoadingWallet(false);
    }
  }

  function disconnectWallet() {
    void StellarWalletsKit.disconnect();
    setPublicKey("");
    setWalletName("");
    setBalance("0");
    setDestination("");
    setAmount("1");
    setSendState({ kind: "idle", message: "" });
  }

  async function sendXlm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!connected) {
      setSendState({ kind: "error", message: "Connect wallet first" });
      return;
    }

    if (!StrKey.isValidEd25519PublicKey(destination)) {
      setSendState({ kind: "error", message: "Destination public key invalid" });
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSendState({ kind: "error", message: "Amount must be greater than 0" });
      return;
    }

    setSendState({ kind: "loading", message: "Building transaction..." });

    try {
      const sourceAccount = await horizonServer.loadAccount(publicKey);
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE
      })
        .addMemo(Memo.text("Loop ROSCA"))
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount: parsedAmount.toString()
          })
        )
        .setTimeout(180)
        .build();

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        transaction.toXDR(),
        {
          address: publicKey,
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE
        }
      );

      const signedTransaction = TransactionBuilder.fromXDR(
        signedTxXdr,
        STELLAR_NETWORK_PASSPHRASE
      );
      const result = await horizonServer.submitTransaction(signedTransaction);

      setSendState({
        kind: "success",
        message: "XLM sent",
        hash: result.hash
      });
      await refreshBalance(publicKey);
    } catch (error) {
      if (isTxRejected(error)) {
        setSendState({
          kind: "error",
          message: "Transaction rejected in wallet"
        });
        return;
      }

      if (isInsufficientBalance(error)) {
        setSendState({
          kind: "error",
          message: "Insufficient balance for this transaction"
        });
        return;
      }

      setSendState({
        kind: "error",
        message: toMessage(error)
      });
    }
  }

  return (
    <section className="dashboard">
      <div className="hero">
        <p className="eyebrow">Stellar Testnet ROSCA starter</p>
        <h1>Loop</h1>
        <p className="lede">
          Rotating savings circle for XLM. Connect Freighter, xBull, Lobstr, or
          another supported wallet, check balance, and send funds on Testnet.
        </p>
        <p className="support">
          Supported wallets: {supportedWallets.length ? supportedWallets.join(", ") : "loading..."}
        </p>
      </div>

      <div className="panel">
        <div className="wallet-row">
          <button onClick={connected ? disconnectWallet : connectWallet}>
            {loadingWallet
              ? "Connecting..."
              : connected
                ? "Disconnect Wallet"
                : "Connect Wallet"}
          </button>
          <span className={connected ? "pill pill-on" : "pill"}>
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>

        <dl className="stats">
          <div>
            <dt>Wallet</dt>
            <dd>{walletName || "—"}</dd>
          </div>
          <div>
            <dt>Public key</dt>
            <dd>{publicKey || "—"}</dd>
          </div>
          <div>
            <dt>XLM balance</dt>
            <dd>{connected ? balanceLabel : "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="panel">
        <h2>Send XLM</h2>
        <form onSubmit={sendXlm} className="form">
          <label>
            Destination public key
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value.trim())}
              placeholder="G..."
              spellCheck="false"
            />
          </label>
          <label>
            Amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="1.0"
            />
          </label>
          <button type="submit">Send XLM</button>
        </form>

        <div className={`message message-${sendState.kind}`}>
          <p>{sendState.message || "Ready."}</p>
          {sendState.hash ? (
            <p className="hash">Transaction hash: {sendState.hash}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
