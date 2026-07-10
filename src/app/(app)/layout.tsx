"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCircle } from "@/lib/circle-context";
import { initWalletKit, getSupportedWallets, getConnectedWalletName } from "@/lib/walletkit";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { horizonServer, nativeBalance, formatXlmBalance } from "@/lib/stellar";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings as SettingsIcon, 
  Wallet, 
  LogOut,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

const S = {
  bg0: "oklch(10% 0.008 85)",
  bg1: "oklch(13% 0.008 85)",
  border: "oklch(20% 0.006 85)",
  borderStrong: "oklch(28% 0.007 85)",
  text1: "oklch(97% 0.005 85)",
  text2: "oklch(68% 0.008 85)",
  text3: "oklch(45% 0.005 85)",
  accent: "oklch(78% 0.15 85)",
  accentDark: "oklch(10% 0.008 85)",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    mode,
    publicKey,
    walletName,
    balance,
    connect,
    disconnect,
    toasts,
    addToast
  } = useCircle();

  const pathname = usePathname();
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => { initWalletKit(); }, []);

  const balanceLabel = useMemo(() => formatXlmBalance(balance), [balance]);

  async function connectWallet() {
    setLoadingWallet(true);
    try {
      const wallets = await getSupportedWallets();
      const available = wallets.filter((w) => w.isAvailable);
      if (!available.length) {
        addToast("No wallets detected. Install Freighter, Lobstr or xBull.", "error");
        return;
      }
      const { address } = await StellarWalletsKit.authModal();
      if (!address) throw new Error("Wallet did not return address");
      const account = await horizonServer.loadAccount(address);
      const nativeBal = nativeBalance(account.balances);
      const name = getConnectedWalletName() || "Stellar Wallet";
      connect(address, name, nativeBal);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Connection failed", "error");
    } finally {
      setLoadingWallet(false);
    }
  }

  function handleDisconnect() {
    void StellarWalletsKit.disconnect();
    disconnect();
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create",    label: "New Circle", icon: PlusCircle },
    { href: "/settings",  label: "Settings",   icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: S.bg0, color: S.text1 }}>
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none w-80">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 12 }}
              className="pointer-events-auto"
              style={{
                background: "oklch(14% 0.008 85)",
                border: `1px solid ${
                  toast.type === "success" ? "oklch(72% 0.14 145 / 0.4)" :
                  toast.type === "error"   ? "oklch(65% 0.16 20 / 0.4)" :
                  "oklch(78% 0.15 85 / 0.3)"
                }`,
                borderRadius: "2px",
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                color:
                  toast.type === "success" ? "oklch(78% 0.12 145)" :
                  toast.type === "error"   ? "oklch(70% 0.14 20)" :
                  "oklch(78% 0.15 85)",
              }}
            >
              {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {toast.type === "error"   && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {toast.type === "info"    && <Info        className="w-4 h-4 shrink-0 mt-0.5" />}
              <span className="text-sm font-light leading-snug">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          borderBottom: `1px solid ${S.border}`,
          background: `${S.bg0}cc`,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div
              className="w-7 h-7 flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: S.accent, color: S.accentDark, borderRadius: "2px" }}
            >
              L
            </div>
            <span className="font-medium text-sm tracking-wide" style={{ color: S.text1 }}>Loop</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium uppercase tracking-widest transition-colors"
                  style={{
                    color: active ? S.accent : S.text3,
                    background: active ? "oklch(78% 0.15 85 / 0.08)" : "transparent",
                    borderRadius: "2px",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: mode badge + wallet */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden md:inline-flex text-[10px] uppercase tracking-widest font-semibold px-2 py-1"
              style={{
                color: mode === "mock" ? S.accent : "oklch(70% 0.007 85)",
                background: mode === "mock" ? "oklch(78% 0.15 85 / 0.08)" : "oklch(17% 0.008 85)",
                border: `1px solid ${mode === "mock" ? "oklch(78% 0.15 85 / 0.2)" : S.border}`,
                borderRadius: "2px",
              }}
            >
              {mode}
            </span>

            {publicKey ? (
              <div
                className="flex items-center gap-2.5 px-3 py-1.5"
                style={{ background: "oklch(14% 0.008 85)", border: `1px solid ${S.border}`, borderRadius: "2px" }}
              >
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest font-medium" style={{ color: S.text3 }}>{walletName}</div>
                  <div className="text-xs font-medium" style={{ color: S.text1 }}>{parseFloat(balanceLabel).toFixed(2)} XLM</div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="transition-colors cursor-pointer"
                  style={{ color: S.text3 }}
                  title="Disconnect"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loadingWallet}
                className="btn btn-primary py-2 px-4 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                {loadingWallet ? "Connecting…" : "Connect"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div
        className="md:hidden flex items-center overflow-x-auto"
        style={{ borderBottom: `1px solid ${S.border}`, background: S.bg0 }}
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors"
              style={{
                color: active ? S.accent : S.text3,
                borderBottomColor: active ? S.accent : "transparent",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-8 py-8 flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
