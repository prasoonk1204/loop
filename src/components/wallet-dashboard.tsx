"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  Asset,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  STELLAR_NETWORK_PASSPHRASE,
  formatXlmBalance,
  horizonServer,
  nativeBalance,
} from "@/lib/stellar";
import {
  getConnectedWalletName,
  getSupportedWallets,
  initWalletKit,
} from "@/lib/walletkit";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Send,
} from "lucide-react";

const S = {
  bg0:          "oklch(10% 0.008 85)",
  bg1:          "oklch(13% 0.008 85)",
  bg2:          "oklch(17% 0.008 85)",
  border:       "oklch(20% 0.006 85)",
  text1:        "oklch(97% 0.005 85)",
  text2:        "oklch(68% 0.008 85)",
  text3:        "oklch(45% 0.005 85)",
  accent:       "oklch(78% 0.15 85)",
  accentBg:     "oklch(78% 0.15 85 / 0.08)",
  accentBorder: "oklch(78% 0.15 85 / 0.25)",
  success:      "oklch(72% 0.14 145)",
  successBg:    "oklch(72% 0.14 145 / 0.08)",
  error:        "oklch(65% 0.16 20)",
  errorBg:      "oklch(65% 0.16 20 / 0.08)",
};

type SendState = {
  kind: "idle" | "loading" | "success" | "error";
  message: string;
  hash?: string;
};

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown wallet error";
}

function isTxRejected(error: unknown) {
  const message = toMessage(error).toLowerCase();
  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: number }).code
      : undefined;
  return (
    code === -1 ||
    message.includes("closed the modal") ||
    message.includes("reject") ||
    message.includes("cancel")
  );
}

function isInsufficientBalance(error: unknown) {
  const message = toMessage(error).toLowerCase();
  const response = error as {
    response?: {
      data?: { extras?: { result_codes?: { transaction?: string } } };
    };
  };
  const txCode =
    response.response?.data?.extras?.result_codes?.transaction;
  return (
    txCode === "tx_insufficient_balance" ||
    message.includes("tx_insufficient_balance")
  );
}

function formatAddr(addr: string) {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: S.bg1,
        border: `1px solid ${S.border}`,
        borderRadius: "4px",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 px-6 py-4"
      style={{ borderBottom: `1px solid ${S.border}` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] uppercase tracking-widest font-semibold block mb-1.5" style={{ color: S.text3 }}>
      {children}
    </label>
  );
}

export function WalletDashboard() {
  const [publicKey, setPublicKey]           = useState("");
  const [walletName, setWalletName]         = useState("");
  const [balance, setBalance]               = useState("0");
  const [loadingWallet, setLoadingWallet]   = useState(false);
  const [destination, setDestination]       = useState("");
  const [amount, setAmount]                 = useState("1");
  const [supportedWallets, setSupportedWallets] = useState<string[]>([]);
  const [sendState, setSendState]           = useState<SendState>({ kind: "idle", message: "" });

  const connected     = Boolean(publicKey);
  const balanceLabel  = useMemo(() => formatXlmBalance(balance), [balance]);

  useEffect(() => {
    initWalletKit();
    void (async () => {
      const wallets = await getSupportedWallets();
      setSupportedWallets(
        wallets.filter((w) => w.isAvailable).map((w) => w.name)
      );
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
      const available = wallets.filter((w) => w.isAvailable);
      setSupportedWallets(available.map((w) => w.name));
      if (!available.length) {
        setSendState({ kind: "error", message: "No wallet found. Install Freighter, xBull, or Lobstr." });
        return;
      }
      const { address } = await StellarWalletsKit.authModal();
      if (!address) throw new Error("Wallet did not return an address");
      setPublicKey(address);
      setWalletName(getConnectedWalletName() || "Stellar Wallet");
      await refreshBalance(address);
    } catch (error) {
      setSendState({ kind: "error", message: toMessage(error) });
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
      setSendState({ kind: "error", message: "Invalid destination public key" });
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSendState({ kind: "error", message: "Amount must be greater than 0" });
      return;
    }
    setSendState({ kind: "loading", message: "Building transaction…" });
    try {
      const sourceAccount = await horizonServer.loadAccount(publicKey);
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addMemo(Memo.text("Loop ROSCA"))
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount: parsedAmount.toString(),
          })
        )
        .setTimeout(180)
        .build();

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        transaction.toXDR(),
        { address: publicKey, networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
      );
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      const result = await horizonServer.submitTransaction(signedTx);

      setSendState({ kind: "success", message: "Transaction submitted", hash: result.hash });
      await refreshBalance(publicKey);
    } catch (error) {
      if (isTxRejected(error)) {
        setSendState({ kind: "error", message: "Transaction rejected in wallet" });
        return;
      }
      if (isInsufficientBalance(error)) {
        setSendState({ kind: "error", message: "Insufficient balance" });
        return;
      }
      setSendState({ kind: "error", message: toMessage(error) });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Wallet className="w-4 h-4" style={{ color: S.accent }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: S.accent }}>
              Wallet
            </p>
            <h1 className="text-2xl font-light" style={{ color: S.text1 }}>
              Stellar Testnet
            </h1>
          </div>
        </div>

        {supportedWallets.length > 0 && (
          <p className="text-[10px] uppercase tracking-widest" style={{ color: S.text3 }}>
            {supportedWallets.join(" · ")}
          </p>
        )}
      </div>

      {/* ── Wallet connection ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionLabel>Connection</SectionLabel>
          <div
            className="ml-auto text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5"
            style={{
              background: connected ? S.successBg : S.bg2,
              color: connected ? S.success : S.text3,
              border: `1px solid ${connected ? "oklch(72% 0.14 145 / 0.2)" : S.border}`,
              borderRadius: "2px",
            }}
          >
            {connected ? "connected" : "not connected"}
          </div>
        </CardHeader>

        {/* Stats row */}
        {connected && (
          <div className="grid grid-cols-3" style={{ borderBottom: `1px solid ${S.border}` }}>
            {[
              { label: "Wallet", value: walletName || "—" },
              {
                label: "Public key",
                value: formatAddr(publicKey),
                title: publicKey,
                mono: true,
              },
              { label: "XLM balance", value: `${parseFloat(balanceLabel).toFixed(4)} XLM` },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="px-5 py-4"
                style={{ borderRight: i < 2 ? `1px solid ${S.border}` : "none" }}
              >
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: S.text3 }}>
                  {stat.label}
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{
                    color: S.text1,
                    fontFamily: stat.mono ? "var(--font-mono)" : undefined,
                    fontSize: stat.mono ? "0.75rem" : undefined,
                  }}
                  title={stat.title}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="p-5">
          {connected ? (
            <button
              onClick={disconnectWallet}
              className="btn btn-secondary py-2.5 px-5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect wallet
            </button>
          ) : (
            <button
              onClick={connectWallet}
              disabled={loadingWallet}
              className="btn btn-primary py-2.5 px-6 cursor-pointer"
            >
              {loadingWallet ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  Connect wallet
                </>
              )}
            </button>
          )}
        </div>
      </Card>

      {/* ── Send XLM ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <Send className="w-3.5 h-3.5" style={{ color: S.accent }} />
          <SectionLabel>Send XLM</SectionLabel>
        </CardHeader>

        <form onSubmit={sendXlm} className="p-6 space-y-4">
          <div>
            <FieldLabel>Destination public key</FieldLabel>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value.trim())}
              placeholder="G…"
              spellCheck={false}
              className="input-field"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
            />
          </div>

          <div>
            <FieldLabel>Amount (XLM)</FieldLabel>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1.0"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={!connected || sendState.kind === "loading"}
            className="btn btn-primary w-full py-3 cursor-pointer"
          >
            {sendState.kind === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {sendState.message}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send XLM
              </>
            )}
          </button>

          {/* Status */}
          {sendState.kind !== "idle" && sendState.kind !== "loading" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-4"
              style={{
                background: sendState.kind === "success" ? S.successBg : S.errorBg,
                border: `1px solid ${sendState.kind === "success" ? "oklch(72% 0.14 145 / 0.2)" : "oklch(65% 0.16 20 / 0.2)"}`,
                borderRadius: "2px",
              }}
            >
              {sendState.kind === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: S.success }} />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: S.error }} />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: sendState.kind === "success" ? S.success : S.error }}>
                  {sendState.message}
                </p>
                {sendState.hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${sendState.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 mt-1.5 text-[11px] font-medium"
                    style={{ color: S.accent }}
                  >
                    View on Stellar Expert
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </form>
      </Card>
    </motion.div>
  );
}
