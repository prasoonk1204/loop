"use client";

import { requestAccess, signTransaction } from "@stellar/freighter-api";
import {
  Asset,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import { useMemo, useState, type FormEvent } from "react";
import {
  STELLAR_NETWORK_PASSPHRASE,
  formatXlmBalance,
  horizonServer,
  nativeBalance
} from "@/lib/stellar";

type SendState = {
  kind: "idle" | "loading" | "success" | "error";
  message: string;
  hash?: string;
};

export function WalletDashboard() {
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState("0");
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");
  const [sendState, setSendState] = useState<SendState>({
    kind: "idle",
    message: ""
  });

  const connected = Boolean(publicKey);
  const balanceLabel = useMemo(() => formatXlmBalance(balance), [balance]);

  async function refreshBalance(address: string) {
    const account = await horizonServer.loadAccount(address);
    setBalance(nativeBalance(account.balances));
  }

  async function connectWallet() {
    setLoadingWallet(true);
    setSendState({ kind: "idle", message: "" });

    try {
      const { address, error } = await requestAccess();
      if (error) {
        throw new Error(error.message);
      }
      if (!address) {
        throw new Error("Freighter did not return an address");
      }

      setPublicKey(address);
      await refreshBalance(address);
    } catch (error) {
      setSendState({
        kind: "error",
        message: error instanceof Error ? error.message : "Wallet connect failed"
      });
    } finally {
      setLoadingWallet(false);
    }
  }

  function disconnectWallet() {
    setPublicKey("");
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

      const { signedTxXdr, error } = await signTransaction(transaction.toXDR(), {
        address: publicKey,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE
      });

      if (error) {
        throw new Error(error.message);
      }

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
      setSendState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Transaction submission failed"
      });
    }
  }

  return (
    <section className="dashboard">
      <div className="hero">
        <p className="eyebrow">Stellar Testnet ROSCA starter</p>
        <h1>Loop</h1>
        <p className="lede">
          Rotating savings circle for XLM. Connect Freighter, check balance, and
          send funds on Testnet.
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
