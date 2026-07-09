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

  useEffect(() => {
    initWalletKit();
  }, []);

  const balanceLabel = useMemo(() => formatXlmBalance(balance), [balance]);

  async function connectWallet() {
    setLoadingWallet(true);
    try {
      const wallets = await getSupportedWallets();
      const availableWallets = wallets.filter((wallet) => wallet.isAvailable);

      if (!availableWallets.length) {
        addToast("No wallets detected. Install Freighter, Lobstr or xBull.", "error");
        return;
      }

      const { address } = await StellarWalletsKit.authModal();
      if (!address) {
        throw new Error("Wallet did not return address");
      }

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

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none w-80">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, x: 16 }}
              className={`p-4 rounded-xl border backdrop-blur-md shadow-lg flex gap-3 pointer-events-auto items-start ${
                toast.type === "success"
                  ? "bg-[#182d21]/90 border-state-success-border/30 text-state-success"
                  : toast.type === "error"
                  ? "bg-[#2d1818]/90 border-state-error-border/30 text-state-error"
                  : "bg-[#1f1d2b]/90 border-panel-border text-brand-accent"
              }`}
            >
              {toast.type === "success" && <CheckCircle className="w-5 h-5 shrink-0" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium leading-relaxed">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/75 backdrop-blur-md border-b border-panel-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-extrabold text-lg text-white shadow-md">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl text-text-main tracking-tight block">Loop</span>
              <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase block">Savings Circle</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex bg-panel-bg border border-panel-border rounded-xl p-1 gap-1.5">
            <Link
              href="/dashboard"
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                pathname === "/dashboard"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                pathname === "/create"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Circle
            </Link>
            <Link
              href="/settings"
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                pathname === "/settings"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border hidden md:inline-block ${
              mode === "mock"
                ? "bg-panel-bg text-brand-accent border-panel-border"
                : "bg-panel-bg text-brand-primary border-panel-border"
            }`}>
              {mode} Mode
            </span>

            {publicKey ? (
              <div className="flex items-center bg-panel-bg border border-panel-border rounded-xl px-4 py-1.5 gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-text-muted block font-semibold">{walletName}</span>
                  <span className="text-xs text-text-main font-bold block">{parseFloat(balanceLabel).toFixed(2)} XLM</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-1.5 text-text-muted hover:text-state-error transition-colors cursor-pointer"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loadingWallet}
                className="btn btn-primary py-2 px-4 text-xs cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>{loadingWallet ? "Connecting..." : "Connect"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 flex-1 w-full">
        {/* Mobile Navigation (Shown only on small screens) */}
        <div className="flex sm:hidden justify-center mb-6">
          <div className="flex bg-panel-bg border border-panel-border rounded-xl p-1 gap-1.5 w-full max-w-sm justify-around">
            <Link
              href="/dashboard"
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                pathname === "/dashboard"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/create"
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                pathname === "/create"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create</span>
            </Link>
            <Link
              href="/settings"
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                pathname === "/settings"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Content View with Route transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
