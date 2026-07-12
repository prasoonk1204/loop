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

  React.useEffect(() => {
    setLocalPool(poolContractId);
    setLocalRegistry(registryContractId);
    setLocalToken(tokenContractId);
  }, [poolContractId, registryContractId, tokenContractId]);

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

      {/* Contract configs */}
      <div
        style={{ background: S.bg1, border: `1px solid ${S.border}`, borderRadius: "4px" }}
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
              disabled: true,
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
                disabled={field.disabled}
                style={field.mono ? { fontFamily: "var(--font-mono)", fontSize: "0.8125rem" } : {}}
              />
            </div>
          ))}

          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save configurations
          </button>
        </form>
      </div>
    </motion.div>
  );
}
