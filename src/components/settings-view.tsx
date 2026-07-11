"use client";

import React, { useState } from "react";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Cpu, Network, Save, ShieldCheck } from "lucide-react";
import { STELLAR_HORIZON_URL } from "@/lib/stellar";

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
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: S.text3 }}>
      {children}
    </label>
  );
}

export function SettingsView() {
  const {
    mode,
    poolContractId,
    registryContractId,
    tokenContractId,
    setMode,
    setContracts,
    addToast,
  } = useCircle();

  const [localPool, setLocalPool]         = useState(poolContractId);
  const [localRegistry, setLocalRegistry] = useState(registryContractId);
  const [localToken, setLocalToken]       = useState(tokenContractId);
  const [horizonUrl, setHorizonUrl]       = useState(STELLAR_HORIZON_URL);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setContracts(localPool.trim(), localRegistry.trim(), localToken.trim());
    addToast("Contract configurations saved.", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-2xl mx-auto"
    >
      {/* Page header */}
      <div className="flex items-center gap-2.5 mb-8">
        <Settings className="w-4 h-4" style={{ color: S.accent }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: S.accent }}>
            Settings
          </p>
          <h1 className="text-2xl font-light mt-0.5" style={{ color: S.text1 }}>
            Developer Configurations
          </h1>
        </div>
      </div>

      {/* Execution engine */}
      <div
        style={{ background: S.bg1, border: `1px solid ${S.border}`, borderRadius: "4px" }}
        className="mb-6"
      >
        <div className="px-6 py-5" style={{ borderBottom: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" style={{ color: S.accent }} />
            <SectionLabel>Execution engine</SectionLabel>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["mock", "soroban"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="py-4 px-5 text-left transition-all cursor-pointer"
                  style={{
                    background: active ? S.accentBg : S.bg2,
                    border: `1px solid ${active ? S.accentBorder : S.border}`,
                    borderRadius: "2px",
                    color: active ? S.accent : S.text3,
                  }}
                >
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: active ? S.accent : S.text3 }}>
                    {m === "mock" ? "Mock Simulator" : "Soroban Contracts"}
                  </div>
                  <div className="text-[11px] font-light" style={{ color: active ? "oklch(68% 0.008 85)" : S.text3 }}>
                    {m === "mock"
                      ? "Runs in React state — no wallet needed"
                      : "Queries live Stellar testnet via RPC"}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-light leading-relaxed" style={{ color: S.text3 }}>
            {mode === "mock"
              ? "Mock simulator runs entirely in browser memory. Perfect for demos without wallet keys or testnet XLM."
              : "Soroban Contracts mode queries real on-chain state via Horizon RPC Testnet using a Freighter wallet."}
          </p>
        </div>
      </div>

      {/* Contract config or mock info */}
      <AnimatePresence mode="wait">
        {mode === "soroban" ? (
          <motion.div
            key="soroban-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: S.bg1, border: `1px solid ${S.border}`, borderRadius: "4px", overflow: "hidden" }}
          >
            <div className="px-6 py-5" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5" style={{ color: S.accent }} />
                <SectionLabel>Network &amp; contract addresses</SectionLabel>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                {
                  label: "Horizon node endpoint",
                  value: horizonUrl,
                  setter: setHorizonUrl,
                  placeholder: "https://horizon-testnet.stellar.org",
                  mono: false,
                },
                {
                  label: "Pool contract (ID)",
                  value: localPool,
                  setter: setLocalPool,
                  placeholder: "CC…",
                  mono: true,
                },
                {
                  label: "Member registry (ID)",
                  value: localRegistry,
                  setter: setLocalRegistry,
                  placeholder: "CC…",
                  mono: true,
                },
                {
                  label: "SAC token contract (ID)",
                  value: localToken,
                  setter: setLocalToken,
                  placeholder: "CD…",
                  mono: true,
                },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <FieldLabel>{field.label}</FieldLabel>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="input-field"
                    placeholder={field.placeholder}
                    style={field.mono ? { fontFamily: "var(--font-mono)", fontSize: "0.8125rem" } : {}}
                  />
                </div>
              ))}

              <button
                type="submit"
                className="btn btn-primary w-full py-3 mt-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save configurations
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="mock-info"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: S.successBg,
              border: `1px solid oklch(72% 0.14 145 / 0.2)`,
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div className="flex gap-3 p-5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: S.success }} />
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: S.success }}>
                  Mock simulator active
                </p>
                <p className="text-xs font-light leading-relaxed" style={{ color: "oklch(60% 0.007 85)" }}>
                  No blockchain configuration required. Balance changes, cycle events, and payouts are fully simulated in memory. Enable auto-simulate on the dashboard to generate live background activity.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
