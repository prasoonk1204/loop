"use client";

import React, { useState } from "react";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, 
  Users, 
  ArrowRightLeft, 
  Play, 
  Pause, 
  CheckCircle2, 
  HelpCircle,
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {/* Left Col: Cycle status and Actions */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Cycle Progress Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Active Savings Round</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">Cycle #{currentCycle}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Current Pot</span>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">{totalPot} <span className="text-sm font-normal">XLM</span></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Contributions Received</span>
              <span className="font-semibold text-white">{contributionsCount} of {totalMembersCount} ({Math.round(progressPercent)}%)</span>
            </div>
            <div className="w-full h-3 bg-purple-950/40 rounded-full overflow-hidden border border-purple-900/30">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-900/20 text-sm">
            <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/10">
              <span className="text-slate-400 block mb-1">Target Payout</span>
              <span className="text-lg font-bold text-white">{expectedTotalPot} XLM</span>
            </div>
            <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-900/10">
              <span className="text-slate-400 block mb-1">Cycle Recipient</span>
              <span className="text-lg font-bold text-cyan-400 block truncate" title={nextPayoutRecipient}>
                {isRecipient ? "You" : formatAddress(nextPayoutRecipient)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => contribute(publicKey)}
              disabled={!publicKey || hasUserContributed || pendingTx}
              className="btn btn-primary flex-1"
            >
              {pendingTx ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : hasUserContributed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Contributed ({contributionAmount} XLM)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Contribute {contributionAmount} XLM
                </span>
              )}
            </button>

            <button
              onClick={triggerPayout}
              disabled={contributionsCount < totalMembersCount || pendingTx}
              className="btn btn-accent flex-1"
            >
              {pendingTx ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-950 rounded-full animate-spin" />
                  Releasing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  Release Payout ({expectedTotalPot} XLM)
                </span>
              )}
            </button>
          </div>

          {!publicKey && (
            <p className="text-sm text-yellow-400/80 text-center mt-3 font-medium">
              * Connect your wallet to contribute to the circle.
            </p>
          )}

          {publicKey && !hasUserContributed && (
            <p className="text-xs text-slate-400 text-center mt-3">
              Your wallet balance: <span className="text-white font-bold">{parseFloat(balance).toFixed(2)} XLM</span>
            </p>
          )}

          {/* Auto Simulator Switch */}
          <div className="mt-6 pt-6 border-t border-purple-900/20 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white flex items-center gap-2">
                Simulate Circle Activity
                <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-800/30">Mock Only</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Let mock members make contributions to trigger live updates.</p>
            </div>
            <button
              onClick={() => setAutoSimulate(!autoSimulate)}
              className={`p-2.5 rounded-xl border transition-all ${
                autoSimulate 
                  ? "bg-purple-900/30 border-purple-500/50 text-purple-400" 
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
              title={autoSimulate ? "Pause Simulation" : "Start Simulation"}
            >
              {autoSimulate ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        {/* Live Transaction Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Live Activity
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {transactions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-500 text-sm"
                >
                  No transactions recorded in this session yet.
                </motion.div>
              ) : (
                transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="p-3 bg-purple-950/10 rounded-xl border border-purple-950/30 flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === "contribute" 
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                          : tx.type === "payout"
                          ? "bg-cyan-950/40 text-cyan-400 border border-cyan-900/30"
                          : "bg-purple-950/40 text-purple-400 border border-purple-900/30"
                      }`}>
                        {tx.type === "contribute" ? <Coins className="w-4 h-4" /> : tx.type === "payout" ? <ArrowRightLeft className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {tx.type === "contribute" ? (
                            <span>Contribution from <span className="font-bold text-slate-300">{formatAddress(tx.member || "")}</span></span>
                          ) : tx.type === "payout" ? (
                            <span>Payout released to <span className="font-bold text-cyan-400">{formatAddress(tx.member || "")}</span></span>
                          ) : (
                            <span>Circle created</span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Cycle #{tx.cycleId} • {new Date(tx.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.amount && <span className="text-white font-bold block">{tx.amount} XLM</span>}
                      {tx.hash && (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-purple-400 hover:text-purple-300 inline-flex items-center gap-0.5 mt-0.5"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel p-6 space-y-4"
      >
        <div className="flex justify-between items-center pb-3 border-b border-purple-900/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Members ({members.length})
          </h3>
        </div>

        <div className="space-y-3">
          {members.map((member, index) => {
            const isUser = member === publicKey;
            const hasContributed = contributedThisCycle.includes(member);
            const isNextRecipient = member === nextPayoutRecipient;

            return (
              <div 
                key={member}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isNextRecipient 
                    ? "bg-cyan-950/15 border-cyan-800/30" 
                    : isUser 
                    ? "bg-purple-950/20 border-purple-800/40" 
                    : "bg-slate-950/40 border-slate-900/80 hover:border-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isNextRecipient 
                      ? "bg-cyan-900/30 text-cyan-400 border border-cyan-800/50" 
                      : isUser 
                      ? "bg-purple-900/30 text-purple-300 border border-purple-800/50" 
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-white block truncate" title={member}>
                      {isUser ? `${formatAddress(member)} (You)` : formatAddress(member)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Member since creation</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasContributed 
                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {hasContributed ? "Paid" : "Unpaid"}
                  </span>
                  
                  {isNextRecipient && (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 flex items-center gap-0.5">
                      Recipient
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
