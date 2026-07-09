"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Zap, 
  Cpu, 
  Coins, 
  Users, 
  Layers
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-main flex flex-col relative overflow-hidden">
      {/* Premium Background Orbits */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Decorative Orbits SVG */}
      <div className="absolute top-[20%] right-[-200px] w-[600px] h-[600px] opacity-10 pointer-events-none hidden lg:block -z-10">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full animate-[spin_120s_linear_infinite]">
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.15" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.15" />
          <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="0.15" strokeDasharray="4 6" />
          <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="0.15" />
          <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="0.15" />
        </svg>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-base/60 backdrop-blur-md border-b border-panel-border/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-extrabold text-lg text-white shadow-md">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl text-text-main tracking-tight block">Loop</span>
              <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase block">Savings Circle</span>
            </div>
          </div>
          
          <Link
            href="/dashboard"
            className="btn btn-primary py-2 px-5 text-xs tracking-wider cursor-pointer"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 flex-1 w-full relative">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-semibold text-brand-primary"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Next-Generation ROSCA Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-text-main leading-[1.1] tracking-tight"
          >
            Trustless Rotating Savings on{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              Stellar
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Pool funds, take turns, and claim the accumulated capital. Secure,
            transparent, peer-to-peer ROSCA savings powered by Stellar Soroban
            smart contracts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
          >
            <Link
              href="/dashboard"
              className="btn btn-primary px-8 py-3.5 text-sm cursor-pointer shadow-lg shadow-brand-primary/10"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/create"
              className="btn btn-secondary px-8 py-3.5 text-sm cursor-pointer"
            >
              Configure a Circle
            </Link>
          </motion.div>
        </div>

        {/* Orbit Demo Component */}
        <div className="flex-1 w-full flex justify-center items-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border border-panel-border/30 flex items-center justify-center relative bg-panel-bg/10 backdrop-blur-[2px]"
          >
            {/* Center Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-extrabold text-3xl text-white shadow-2xl relative">
              L
              <div className="absolute inset-0 rounded-2xl bg-white/10 animate-ping" />
            </div>

            {/* Orbit paths */}
            <div className="absolute inset-[15%] rounded-full border border-dashed border-panel-border/40 animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-[30%] rounded-full border border-panel-border/30 animate-[spin_40s_linear_infinite_reverse]" />

            {/* Orbiting nodes */}
            <div className="absolute top-[15%] left-[15%] w-4 h-4 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/50" />
            <div className="absolute bottom-[30%] right-[6%] w-3 h-3 rounded-full bg-brand-accent shadow-lg shadow-brand-accent/50" />
            <div className="absolute bottom-[10%] left-[25%] w-3.5 h-3.5 rounded-full bg-text-muted border border-panel-border" />
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-panel-bg/25 border-y border-panel-border/45 py-24 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold font-heading text-text-main tracking-tight">
              The ROSCA Cycle
            </h2>
            <p className="text-sm text-text-muted max-w-xl mx-auto font-medium">
              A rotating savings circle allows members to systematically save and access larger pools of capital trustlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-panel p-6 space-y-4 hover:border-brand-primary/20">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center font-bold text-brand-primary font-heading">
                1
              </div>
              <h3 className="text-lg font-bold text-text-main">Establish the Circle</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Set rotation parameters: contributions (e.g. 100 XLM), cycle length (in ledgers), and list of participant public keys.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 space-y-4 hover:border-brand-primary/20">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center font-bold text-brand-primary font-heading">
                2
              </div>
              <h3 className="text-lg font-bold text-text-main">Cycle Deposit</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                In each rotation round, every member deposits their contribution amount into the smart contract pool escrow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 space-y-4 hover:border-brand-accent/20">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center font-bold text-brand-accent font-heading">
                3
              </div>
              <h3 className="text-lg font-bold text-text-main">Automatic Payout</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Once all round deposits are received, the pool contract automatically releases the full pot to the {"round's"} designated recipient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions / Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold font-heading text-text-main tracking-tight">
            Designed for Trustless Finance
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto font-medium">
            Loop leverages the speed and security of Stellar to bring Rotating Savings Circles online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Bento */}
          <div className="glass-panel p-8 md:col-span-2 flex flex-col justify-between space-y-8 hover:border-brand-primary/25">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Soroban Smart Contracts</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Loop transactions execute trustlessly via custom WebAssembly contracts on {"Stellar's"} Soroban network. Deposits are securely held in escrow and released only when all conditions are fulfilled. No administrators, no middlemen, zero counterparty risk.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold bg-bg-base border border-panel-border/70 text-text-muted px-2.5 py-1 rounded-full">Soroban WASM</span>
              <span className="text-[10px] uppercase tracking-widest font-bold bg-bg-base border border-panel-border/70 text-text-muted px-2.5 py-1 rounded-full">Escrow API</span>
            </div>
          </div>

          {/* Card 2: Small Bento */}
          <div className="glass-panel p-8 flex flex-col justify-between space-y-8 hover:border-brand-accent/25">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Mock Simulator</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Try out the rotating savings circle flow immediately. Our mock simulation tool populates active circles and triggers contributions, mimicking on-chain latency.
              </p>
            </div>
            <Link href="/dashboard" className="text-xs text-brand-accent hover:text-brand-accent-hover font-bold inline-flex items-center gap-1">
              Try simulator
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Small Bento */}
          <div className="glass-panel p-8 flex flex-col justify-between space-y-8 hover:border-brand-primary/25">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Stellar Native</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Make contributions in native XLM with transaction fees under a fraction of a cent. Integrates with Freighter wallet out of the box.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-text-subtle">Stellar SDK v16</span>
          </div>

          {/* Card 4: Large Bento */}
          <div className="glass-panel p-8 md:col-span-2 flex flex-col justify-between space-y-8 hover:border-brand-primary/25">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#241f3d]/50 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-main tracking-tight">Collaborative Capital</h3>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                ROSCA (Rotating Savings and Credit Associations) communities have enabled informal peer-to-peer banking globally for centuries. Loop digitizes this powerful social tool, letting you construct decentralized networks of trustless savings pools.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold bg-bg-base border border-panel-border/70 text-text-muted px-2.5 py-1 rounded-full">Community Escrow</span>
              <span className="text-[10px] uppercase tracking-widest font-bold bg-bg-base border border-panel-border/70 text-text-muted px-2.5 py-1 rounded-full">Decentralized Savings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="bg-bg-base border-t border-panel-border/40 py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 relative">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold font-heading text-text-main tracking-tight">
              Ready to loop your savings?
            </h3>
            <p className="text-xs text-text-muted font-medium">
              Start a rotating savings pool on Stellar Testnet now.
            </p>
          </div>
          
          <Link
            href="/dashboard"
            className="btn btn-primary px-8 py-3.5 text-sm cursor-pointer shadow-lg shadow-brand-primary/10"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-panel-border/20 text-center text-[10px] text-text-subtle font-bold tracking-widest uppercase">
          &copy; 2026 Loop Savings Circle. Built on Stellar Soroban.
        </div>
      </footer>
    </div>
  );
}
