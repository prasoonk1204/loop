"use client";

import React from "react";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  Users, 
  ArrowRightLeft, 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight
} from "lucide-react";

function formatAddress(addr: string) {
  if (!addr) return "—";
  if (addr.length < 15) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
    autoSimulate,
    contribute,
    triggerPayout,
    setAutoSimulate,
  } = useCircle();

  const totalPot = contributionAmount * contributedThisCycle.length;
  const expectedTotalPot = contributionAmount * members.length;
  const contributionsCount = contributedThisCycle.length;
  const totalMembersCount = members.length;
  const progressPercent = (contributionsCount / totalMembersCount) * 100;
  const isRecipient = publicKey === nextPayoutRecipient;

  const hasUserContributed = publicKey ? contributedThisCycle.includes(publicKey) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Col: Cycle status and Actions */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Cycle Progress Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-6 relative overflow-hidden"
        >
          {/* Subtle cosmic background gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-brand-accent/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-brand-primary font-bold">Active Savings Round</span>
              <h2 className="text-3xl font-extrabold text-text-main mt-1.5 tracking-tight">Cycle #{currentCycle}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-brand-accent font-bold">Current Pot</span>
              <div className="text-3xl font-extrabold text-brand-accent mt-1.5 tracking-tight">
                {totalPot} <span className="text-xs font-semibold text-text-muted">XLM</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Contributions Received</span>
              <span className="font-bold text-text-main">{contributionsCount} of {totalMembersCount} ({Math.round(progressPercent)}%)</span>
            </div>
            <div className="w-full h-2 bg-bg-base/80 rounded-full overflow-hidden border border-panel-border/60">
              <motion.div 
                className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-5 border-t border-panel-border/40 text-sm">
            <div className="p-4 bg-bg-base/35 rounded-xl border border-panel-border/30">
              <span className="text-[10px] uppercase tracking-widest text-text-subtle block font-bold mb-1">Target Payout</span>
              <span className="text-lg font-bold text-text-main">{expectedTotalPot} XLM</span>
            </div>
            <div className="p-4 bg-bg-base/35 rounded-xl border border-panel-border/30">
              <span className="text-[10px] uppercase tracking-widest text-text-subtle block font-bold mb-1">Cycle Recipient</span>
              <span className="text-lg font-bold text-brand-accent block truncate" title={nextPayoutRecipient}>
                {isRecipient ? "You" : formatAddress(nextPayoutRecipient)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold text-text-main mb-4 tracking-tight">Actions</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => contribute(publicKey)}
              disabled={!publicKey || hasUserContributed || pendingTx}
              className="btn btn-primary flex-1 py-3 text-sm cursor-pointer"
            >
              {pendingTx ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : hasUserContributed ? (
                <span className="flex items-center gap-2 text-state-success font-semibold">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  Contributed ({contributionAmount} XLM)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Coins className="w-4.5 h-4.5" />
                  Contribute {contributionAmount} XLM
                </span>
              )}
            </button>

            <button
              onClick={triggerPayout}
              disabled={contributionsCount < totalMembersCount || pendingTx}
              className="btn btn-accent flex-1 py-3 text-sm cursor-pointer"
            >
              {pendingTx ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Releasing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4.5 h-4.5" />
                  Release Payout ({expectedTotalPot} XLM)
                </span>
              )}
            </button>
          </div>

          {!publicKey && (
            <p className="text-xs text-brand-accent/80 text-center mt-3 font-semibold tracking-wide">
              * Connect your wallet to contribute to the circle.
            </p>
          )}

          {publicKey && !hasUserContributed && (
            <p className="text-xs text-text-muted text-center mt-3 font-medium">
              Your wallet balance: <span className="text-text-main font-bold">{parseFloat(balance).toFixed(2)} XLM</span>
            </p>
          )}

          {/* Auto Simulator Switch */}
          <div className="mt-6 pt-6 border-t border-panel-border/40 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-text-main flex items-center gap-2 text-sm tracking-tight">
                Simulate Circle Activity
                <span className="text-[9px] uppercase font-bold tracking-widest bg-panel-border text-brand-primary px-2 py-0.5 rounded border border-panel-border/50">Mock Only</span>
              </h4>
              <p className="text-xs text-text-muted mt-0.5">Let mock members make contributions to trigger live updates.</p>
            </div>
            <button
              onClick={() => setAutoSimulate(!autoSimulate)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                autoSimulate 
                  ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-sm" 
                  : "bg-bg-base/60 border-panel-border text-text-muted hover:border-panel-border-hover hover:text-text-main"
              }`}
              title={autoSimulate ? "Pause Simulation" : "Start Simulation"}
            >
              {autoSimulate ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Live Transaction Log */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2 tracking-tight">
            <Clock className="w-5 h-5 text-brand-primary" />
            Live Activity
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {transactions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-text-subtle text-xs font-semibold"
                >
                  No transactions recorded in this session yet.
                </motion.div>
              ) : (
                transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -16, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    className="p-3 bg-bg-base/30 rounded-xl border border-panel-border/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        tx.type === "contribute" 
                          ? "bg-[#182d21]/60 text-state-success border-state-success-border/20" 
                          : tx.type === "payout"
                          ? "bg-[#182b2f]/60 text-brand-accent border-brand-accent/20"
                          : "bg-[#241f3d]/60 text-brand-primary border-brand-primary/20"
                      }`}>
                        {tx.type === "contribute" ? <Coins className="w-4 h-4" /> : tx.type === "payout" ? <ArrowRightLeft className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-text-main font-semibold">
                          {tx.type === "contribute" ? (
                            <span>Contribution from <span className="font-bold text-text-muted">{formatAddress(tx.member || "")}</span></span>
                          ) : tx.type === "payout" ? (
                            <span>Payout released to <span className="font-bold text-brand-accent">{formatAddress(tx.member || "")}</span></span>
                          ) : (
                            <span>Circle created</span>
                          )}
                        </p>
                        <span className="text-[10px] text-text-subtle block mt-0.5 font-medium">Cycle #{tx.cycleId} • {new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.amount && <span className="text-text-main font-bold block">{tx.amount} XLM</span>}
                      {tx.hash && (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-brand-primary hover:text-brand-primary-hover font-semibold inline-flex items-center gap-0.5 mt-0.5 transition-colors"
                        >
                          hash
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Right Col: Circle Members */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-6 space-y-4"
      >
        <div className="flex justify-between items-center pb-3 border-b border-panel-border/55">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-brand-primary" />
            Members ({members.length})
          </h3>
        </div>

        <div className="space-y-3">
          {members.map((member, index) => {
            const isUser = member === publicKey;
            const hasContributed = contributedThisCycle.includes(member);
            const isNextRecipient = member === nextPayoutRecipient;

            return (
              <motion.div 
                key={member}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isNextRecipient 
                    ? "bg-[#182b2f]/30 border-brand-accent/25 hover:border-brand-accent/40" 
                    : isUser 
                    ? "bg-[#241f3d]/30 border-brand-primary/25 hover:border-brand-primary/40" 
                    : "bg-bg-base/40 border-panel-border hover:border-panel-border-hover"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isNextRecipient 
                      ? "bg-[#182b2f]/70 text-brand-accent border border-brand-accent/25" 
                      : isUser 
                      ? "bg-[#241f3d]/70 text-brand-primary border border-brand-primary/25" 
                      : "bg-bg-base text-text-muted border border-panel-border/70"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-text-main block truncate" title={member}>
                      {isUser ? `${formatAddress(member)} (You)` : formatAddress(member)}
                    </span>
                    <span className="text-[10px] text-text-subtle block font-medium">Member since creation</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    hasContributed 
                      ? "bg-[#182d21]/60 text-state-success border-state-success-border/20" 
                      : "bg-bg-base/60 text-text-subtle border-panel-border/70"
                  }`}>
                    {hasContributed ? "Paid" : "Unpaid"}
                  </span>
                  
                  {isNextRecipient && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-brand-accent flex items-center gap-0.5">
                      Recipient
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
