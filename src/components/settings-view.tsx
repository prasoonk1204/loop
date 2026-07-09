"use client";

import React, { useState } from "react";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Cpu, 
  Network, 
  Save, 
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel p-6 max-w-2xl mx-auto space-y-6"
    >
      <h2 className="text-lg font-bold tracking-tight text-text-main flex items-center gap-2 border-b border-panel-border/40 pb-3">
        <Settings className="w-5 h-5 text-brand-primary" />
        Developer Configurations
      </h2>

      {/* Mode selection */}
      <div className="space-y-3">
        <label className="text-xs uppercase font-bold tracking-widest text-text-muted flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-brand-primary" />
          Execution Engine
        </label>
        
        <div className="flex gap-4">
          <button
            onClick={() => setMode("mock")}
            className={`btn flex-1 py-4 font-bold border transition-all cursor-pointer ${
              mode === "mock"
                ? "bg-[#241f3d]/30 border-brand-primary/25 text-text-main shadow-sm"
                : "bg-bg-base/40 border-panel-border text-text-muted hover:border-panel-border-hover"
            }`}
          >
            Mock Simulator
          </button>
          <button
            onClick={() => setMode("soroban")}
            className={`btn flex-1 py-4 font-bold border transition-all cursor-pointer ${
              mode === "soroban"
                ? "bg-[#241f3d]/30 border-brand-primary/25 text-text-main shadow-sm"
                : "bg-bg-base/40 border-panel-border text-text-muted hover:border-panel-border-hover"
            }`}
          >
            Stellar Soroban Contracts
          </button>
        </div>
        <p className="text-[11px] text-text-subtle font-medium">
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
            className="space-y-4 pt-4 border-t border-panel-border/30"
          >
            <h3 className="text-sm font-bold text-brand-primary flex items-center gap-1.5">
              <Network className="w-4.5 h-4.5" />
              Network & Contract Addresses
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted">Horizon Node Endpoint</label>
              <input
                type="text"
                value={horizonUrl}
                onChange={(e) => setHorizonUrl(e.target.value)}
                className="input-field"
                placeholder="https://horizon-testnet.stellar.org"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted">PoolContract (ID)</label>
              <input
                type="text"
                value={localPool}
                onChange={(e) => setLocalPool(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CC..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted">MemberRegistry (ID)</label>
              <input
                type="text"
                value={localRegistry}
                onChange={(e) => setLocalRegistry(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CC..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted">Stellar Asset Contract - SAC Token (ID)</label>
              <input
                type="text"
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="CD..."
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4 py-3 text-sm cursor-pointer">
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
            className="p-4 bg-bg-base/35 rounded-xl border border-panel-border/60 text-xs text-text-muted flex gap-3 leading-relaxed border-t border-panel-border/30"
          >
            <ShieldCheck className="w-5 h-5 text-brand-accent shrink-0" />
            <div>
              <span className="font-bold text-brand-primary block mb-0.5">Mock Simulator Engaged</span>
              No blockchain configurations required. Balance changes, cycles, event subscriptions, and payouts are fully simulated in memory. Auto-simulation panel on dashboard generates live background transactions.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
