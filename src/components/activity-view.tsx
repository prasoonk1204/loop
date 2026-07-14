"use client";

import React from "react";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Users,
  ArrowRightLeft,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const S = {
  bg0: "oklch(10% 0.008 85)",
  bg1: "oklch(13% 0.008 85)",
  bg2: "oklch(17% 0.008 85)",
  border: "oklch(20% 0.006 85)",
  borderHover: "oklch(28% 0.007 85)",
  text1: "oklch(97% 0.005 85)",
  text2: "oklch(68% 0.008 85)",
  text3: "oklch(45% 0.005 85)",
  accent: "oklch(78% 0.15 85)",
  accentBg: "oklch(78% 0.15 85 / 0.08)",
  accentBorder: "oklch(78% 0.15 85 / 0.25)",
  success: "oklch(72% 0.14 145)",
  successBg: "oklch(18% 0.03 145)",
  error: "oklch(65% 0.16 20)",
};

function formatAddress(addr: string) {
  if (!addr) return "—";
  if (addr.length < 15) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
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

export function ActivityView() {
  const {
    publicKey,
    loading,
    transactions,
  } = useCircle();

  if (!publicKey) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-6">
        <motion.div
          key="wallet-not-connected"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 space-y-6"
          style={{
            background: "oklch(13% 0.008 85)",
            border: "1px solid oklch(20% 0.006 85)",
            borderRadius: "4px",
          }}
        >
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full" style={{ background: "oklch(78% 0.15 85 / 0.1)" }}>
            <ArrowUpRight className="w-6 h-6" style={{ color: "oklch(78% 0.15 85)" }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-light" style={{ color: S.text1 }}>Wallet Not Connected</h2>
            <p className="text-xs" style={{ color: S.text3 }}>
              Connect your Stellar wallet to view contract transaction history.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <motion.div
          key="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-[oklch(78%_0.15_85)] border-t-transparent rounded-full"
        />
        <p className="text-xs uppercase tracking-widest font-semibold animate-pulse" style={{ color: "oklch(45% 0.005 85)" }}>
          Synchronizing with Stellar Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <div
            className="flex items-center gap-2 p-6"
            style={{ borderBottom: `1px solid ${S.border}` }}
          >
            <Clock className="w-4 h-4" style={{ color: S.accent }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
              Contract Activity Log
            </p>
          </div>
          <div className="p-3 overflow-y-auto">
            <AnimatePresence initial={false}>
              {transactions.length === 0 ? (
                <div className="py-20 text-center text-xs" style={{ color: S.text3 }}>
                  No transactions yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: `1px solid ${S.border}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 flex items-center justify-center shrink-0"
                        style={{
                          background:
                            tx.type === "contribute" ? S.successBg :
                              tx.type === "payout" ? S.accentBg :
                                S.bg2,
                          color:
                            tx.type === "contribute" ? S.success :
                              tx.type === "payout" ? S.accent :
                                S.text2,
                          border: `1px solid ${tx.type === "contribute" ? "oklch(72% 0.14 145 / 0.2)" :
                            tx.type === "payout" ? S.accentBorder :
                              S.border
                            }`,
                          borderRadius: "2px",
                        }}
                      >
                        {tx.type === "contribute" ? <Coins className="w-3.5 h-3.5" /> :
                          tx.type === "payout" ? <ArrowRightLeft className="w-3.5 h-3.5" /> :
                            <Users className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: S.text1 }}>
                          {tx.type === "contribute"
                            ? <>Contribution from <span style={{ color: S.text2 }}>{formatAddress(tx.member || "")}</span></>
                            : tx.type === "payout"
                              ? <>Payout → <span style={{ color: S.accent }}>{formatAddress(tx.member || "")}</span></>
                              : "Circle created"}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: S.text3 }}>
                          Cycle #{tx.cycleId} · {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {tx.amount !== undefined && tx.amount > 0 ? (
                        <span className="text-xs font-medium mr-2" style={{ color: S.text1 }}>
                          {tx.amount} XLM
                        </span>
                      ) : (
                        tx.type !== "create" && (
                          <span className="text-xs font-medium mr-2" style={{ color: S.text3 }}>
                            —
                          </span>
                        )
                      )}
                      {tx.hash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] mt-0.5"
                          style={{ color: S.accent }}
                        >
                          view <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
