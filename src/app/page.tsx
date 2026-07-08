"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCircle } from "@/lib/circle-context";
import { DashboardView } from "@/components/dashboard-view";
import { CreateView } from "@/components/create-view";
import { SettingsView } from "@/components/settings-view";
import { initWalletKit, getSupportedWallets, getConnectedWalletName } from "@/lib/walletkit";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { horizonServer, nativeBalance, formatXlmBalance } from "@/lib/stellar";
import { motion, AnimatePresence } from "framer-motion";
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

type Tab = "dashboard" | "create" | "settings";

export default function Home() {
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

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
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
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex gap-3 pointer-events-auto items-start ${
                toast.type === "success"
                  ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                  : toast.type === "error"
                  ? "bg-red-950/70 border-red-500/40 text-red-300"
                  : "bg-purple-950/70 border-purple-500/40 text-purple-300"
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
      <header className="sticky top-0 z-40 bg-[#03000d]/65 backdrop-blur-md border-b border-purple-900/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center font-extrabold text-lg text-white shadow-lg shadow-purple-500/20">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl text-white tracking-tight block">Loop</span>
              <span className="text-[10px] text-purple-400 font-medium tracking-wider uppercase block">Savings Circle</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex bg-purple-950/20 border border-purple-900/15 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "create"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Circle
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border hidden md:inline-block ${
              mode === "mock"
                ? "bg-cyan-950/30 text-cyan-400 border-cyan-800/30"
                : "bg-purple-950/30 text-purple-400 border-purple-800/30"
            }`}>
              {mode} Mode
            </span>

            {publicKey ? (
              <div className="flex items-center bg-purple-950/20 border border-purple-900/25 rounded-xl px-4 py-1.5 gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">{walletName}</span>
                  <span className="text-xs text-white font-bold block">{parseFloat(balanceLabel).toFixed(2)} XLM</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loadingWallet}
                className="btn btn-primary py-2.5 px-5 text-sm"
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
          <div className="flex bg-purple-950/20 border border-purple-900/15 rounded-xl p-1 gap-1 w-full max-w-sm justify-around">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all ${
                activeTab === "dashboard"
                  ? "bg-purple-50 text-purple-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all ${
                activeTab === "create"
                  ? "bg-purple-50 text-purple-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`p-2.5 text-xs font-semibold rounded-lg flex-1 flex flex-col items-center gap-1 transition-all ${
                activeTab === "settings"
                  ? "bg-purple-50 text-purple-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Content View with Page Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "create" && <CreateView onComplete={() => setActiveTab("dashboard")} />}
            {activeTab === "settings" && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
