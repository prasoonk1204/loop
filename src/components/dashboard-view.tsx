"use client";

import React from "react";
import Link from "next/link";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Users,
  ArrowRightLeft,
  CheckCircle2,
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-widest font-semibold"
      style={{ color: S.text3 }}
    >
      {children}
    </span>
  );
}

export function DashboardView() {
  const {
    publicKey,
    balance,
    members,
    contributionAmount,
    currentCycle,
    contributedThisCycle,
    nextPayoutRecipient,
    pendingTx,
    transactions,
    loading,
    contribute,
    triggerPayout,
    deleteCircle,
    leaveCircle,
  } = useCircle();

  const totalPot = contributionAmount * contributedThisCycle.length;
  const expectedTotalPot = contributionAmount * members.length;
  const contributionsCount = contributedThisCycle.length;
  const totalMembersCount = members.length;
  const progressPercent = totalMembersCount ? (contributionsCount / totalMembersCount) * 100 : 0;
  const isRecipient = publicKey === nextPayoutRecipient;
  const hasUserContributed = publicKey ? contributedThisCycle.includes(publicKey) : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <motion.div
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

  if (!members || members.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-6">
        <motion.div
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
            <Users className="w-6 h-6" style={{ color: "oklch(78% 0.15 85)" }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-light" style={{ color: S.text1 }}>No Active Circle</h2>
            <p className="text-xs" style={{ color: S.text3 }}>
              You are not currently in a savings circle. Create a new circle to start contributing and saving with others.
            </p>
          </div>
          <Link
            href="/create"
            className="btn btn-primary w-full py-3 inline-flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
          >
            Create Savings Circle
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* ── Left col ───────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Cycle status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            {/* Top row */}
            <div
              className="flex items-start justify-between p-6 pb-5"
              style={{ borderBottom: `1px solid ${S.border}` }}
            >
              <div>
                <Label>Active round</Label>
                <div
                  className="text-4xl font-light mt-1 tracking-tight"
                  style={{ color: S.text1 }}
                >
                  Cycle #{currentCycle}
                </div>
              </div>
              <div className="text-right">
                <Label>Current pot</Label>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className="text-4xl font-light tracking-tight"
                    style={{ color: S.accent }}
                  >
                    {totalPot}
                  </span>
                  <span className="text-xs" style={{ color: S.text3 }}>XLM</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <Label>Contributions received</Label>
                <span className="text-xs font-medium" style={{ color: S.text2 }}>
                  {contributionsCount} / {totalMembersCount}
                </span>
              </div>
              <div
                className="w-full h-1.5 overflow-hidden"
                style={{ background: S.bg0, borderRadius: "1px" }}
              >
                <motion.div
                  style={{ background: S.accent, height: "100%", borderRadius: "1px" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Bottom stats */}
            <div
              className="grid grid-cols-2"
              style={{ borderTop: `1px solid ${S.border}` }}
            >
              <div
                className="p-5"
                style={{ borderRight: `1px solid ${S.border}` }}
              >
                <Label>Target payout</Label>
                <div
                  className="text-xl font-light mt-1"
                  style={{ color: S.text1 }}
                >
                  {expectedTotalPot} XLM
                </div>
              </div>
              <div className="p-5">
                <Label>This cycle&apos;s recipient</Label>
                <div
                  className="text-xl font-light mt-1 truncate"
                  style={{ color: isRecipient ? S.accent : S.text1 }}
                  title={nextPayoutRecipient}
                >
                  {isRecipient ? "You ✦" : formatAddress(nextPayoutRecipient)}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            <div className="p-6" style={{ borderBottom: `1px solid ${S.border}` }}>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
                Actions
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => contribute(publicKey)}
                  disabled={!publicKey || hasUserContributed || pendingTx}
                  className="btn btn-primary flex-1 py-3 cursor-pointer"
                >
                  {pendingTx ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : hasUserContributed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Contributed ({contributionAmount} XLM)
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      Contribute {contributionAmount} XLM
                    </>
                  )}
                </button>

                <button
                  onClick={triggerPayout}
                  disabled={contributionsCount < totalMembersCount || pendingTx}
                  className="btn btn-secondary flex-1 py-3 cursor-pointer"
                >
                  {pendingTx ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Releasing…
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      Release Payout ({expectedTotalPot} XLM)
                    </>
                  )}
                </button>
              </div>

              {!publicKey && (
                <p className="text-xs text-center" style={{ color: S.accent }}>
                  Connect your wallet to contribute.
                </p>
              )}

              {publicKey && !hasUserContributed && (
                <p className="text-xs text-center" style={{ color: S.text3 }}>
                  Balance:{" "}
                  <span style={{ color: S.text2 }}>
                    {parseFloat(balance).toFixed(2)} XLM
                  </span>
                </p>
              )}

              {publicKey && members.includes(publicKey) && (
                <>
                  <div style={{ borderTop: `1px solid ${S.border}`, margin: "1rem 0" }} />
                  <div className="flex flex-col sm:flex-row gap-3">
                    {publicKey !== members[0] ? (
                      <button
                        onClick={leaveCircle}
                        disabled={pendingTx}
                        className="btn btn-secondary flex-1 py-2.5 text-xs font-semibold cursor-pointer border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/40"
                      >
                        Leave Circle
                      </button>
                    ) : (
                      <button
                        onClick={deleteCircle}
                        disabled={pendingTx}
                        className="btn btn-secondary flex-1 py-2.5 text-xs font-semibold cursor-pointer border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/40"
                      >
                        Delete Circle
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Live activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            <div
              className="flex items-center gap-2 p-6"
              style={{ borderBottom: `1px solid ${S.border}` }}
            >
              <Clock className="w-4 h-4" style={{ color: S.accent }} />
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
                Live activity
              </p>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              <AnimatePresence initial={false}>
                {transactions.length === 0 ? (
                  <div className="py-10 text-center text-xs" style={{ color: S.text3 }}>
                    No transactions yet.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between px-4 py-3"
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
                        {tx.amount && (
                          <span className="text-xs font-medium" style={{ color: S.text1 }}>
                            {tx.amount} XLM
                          </span>
                        )}
                        {tx.hash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-0.5 text-[10px] mt-0.5"
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

      {/* ── Right col: members ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <div
            className="flex items-center gap-2 p-6"
            style={{ borderBottom: `1px solid ${S.border}` }}
          >
            <Users className="w-4 h-4" style={{ color: S.accent }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
              Members ({members.length})
            </p>
          </div>
          <div>
            {members.map((member, index) => {
              const isUser = member === publicKey;
              const hasContributed = contributedThisCycle.includes(member);
              const isNextRecipient = member === nextPayoutRecipient;

              return (
                <motion.div
                  key={member}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.08 + index * 0.04 }}
                  className="flex items-center justify-between px-5 py-4"
                  style={{
                    borderBottom: `1px solid ${S.border}`,
                    background:
                      isNextRecipient ? "oklch(78% 0.15 85 / 0.04)" :
                        isUser ? "oklch(17% 0.008 85 / 0.5)" :
                          "transparent",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Index badge */}
                    <div
                      className="w-7 h-7 shrink-0 flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        background: isNextRecipient ? S.accentBg : S.bg2,
                        color: isNextRecipient ? S.accent : S.text3,
                        border: `1px solid ${isNextRecipient ? S.accentBorder : S.border}`,
                        borderRadius: "2px",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: isUser ? S.accent : S.text1 }}
                        title={member}
                      >
                        {isUser ? `${formatAddress(member)} (you)` : formatAddress(member)}
                      </p>
                      {isNextRecipient && (
                        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: S.accent }}>
                          recipient
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 shrink-0"
                    style={{
                      background: hasContributed ? "oklch(72% 0.14 145 / 0.1)" : S.bg2,
                      color: hasContributed ? S.success : S.text3,
                      border: `1px solid ${hasContributed ? "oklch(72% 0.14 145 / 0.2)" : S.border}`,
                      borderRadius: "2px",
                    }}
                  >
                    {hasContributed ? "paid" : "—"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
