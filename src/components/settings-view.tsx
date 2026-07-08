"use client";

import React, { useState } from "react";
import { useCircle } from "@/lib/circle-context";
import { motion } from "framer-motion";
import { 
  Settings, 
  Cpu, 
  Network, 
  Terminal, 
  Save, 
  FileCode,
  ShieldCheck
} from "lucide-react";

export function SettingsView() {
  const {
    mode,
    poolContractId,
    registryContractId,
    tokenContractId,
    setMode,
    setContracts,
    addToast
  } = useCircle();

  const [localPool, setLocalPool] = useState(poolContractId);
  const [localRegistry, setLocalRegistry] = useState(registryContractId);
  const [localToken, setLocalToken] = useState(tokenContractId);
  const [horizonUrl, setHorizonUrl] = useState("https://horizon-testnet.stellar.org");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setContracts(localPool.trim(), localRegistry.trim(), localToken.trim());
    addToast("Stellar Soroban configurations saved!", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 max-w-2xl mx-auto space-y-6"
    >
      <h2 className="text-2xl font-bold text-white flex items-center gap-2 border-b border-purple-900/20 pb-3">
        <Settings className="w-6 h-6 text-purple-400" />
        Developer Configurations
      </h2>

      {/* Mode selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-purple-400" />
          Execution Engine
        </label>
        
        <div className="flex gap-4">
          <button
            onClick={() => setMode("mock")}
            className={`btn flex-1 py-4 font-bold border transition-all ${
              mode === "mock"
                ? "bg-purple-900/30 border-purple-500/60 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
            }`}
          >
            Mock Simulator
          </button>
          <button
            onClick={() => setMode("soroban")}
            className={`btn flex-1 py-4 font-bold border transition-all ${
              mode === "soroban"
                ? "bg-purple-900/30 border-purple-500/60 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
            }`}
          >
            Stellar Soroban Contracts
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {mode === "mock" 
            ? "Mock Simulator runs entirely locally in React state. Perfect for demonstration without wallet keys." 
            : "Soroban Contracts Mode queries real on-chain state on Horizon/RPC Testnet using Freighter wallet."}
        </p>
      </div>

      {/* Contract Config Form */}
      <AnimatePresence mode="wait">
        {mode === "soroban" ? (
          <motion.form
            key="soroban-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="space-y-4 pt-4 border-t border-purple-900/20"
          >
            <h3 className="text-md font-bold text-purple-300 flex items-center gap-1.5">
              <Network className="w-4.5 h-4.5" />
              Network & Contract Addresses
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Horizon Node Endpoint</label>
              <input
                type="text"
                value={horizonUrl}
                onChange={(e) => setHorizonUrl(e.target.value)}
                className="input-field"
                placeholder="https://horizon-testnet.stellar.org"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">PoolContract (ID)</label>
              <input
                type="text"
                value={localPool}
                onChange={(e) => setLocalPool(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CC..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">MemberRegistry (ID)</label>
              <input
                type="text"
                value={localRegistry}
                onChange={(e) => setLocalRegistry(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CC..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Stellar Asset Contract - SAC Token (ID)</label>
              <input
                type="text"
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CD..."
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4">
              <Save className="w-4 h-4" />
              <span>Save Smart Contract Configurations</span>
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="mock-info"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-cyan-950/20 rounded-2xl border border-cyan-900/10 text-xs text-slate-400 flex gap-3 leading-relaxed border-t border-purple-900/20"
          >
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white block mb-0.5">Mock Simulator Engaged</span>
              No blockchain configurations required. Balance changes, cycles, event subscriptions, and payouts are fully simulated in memory. Auto-simulation panel on dashboard generates live background transactions.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { AnimatePresence } from "framer-motion";
