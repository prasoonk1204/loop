"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

function FadeUp({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function StaticGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.04] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(oklch(78% 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(78% 0.15 85) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(10% 0.008 85)", color: "oklch(97% 0.005 85)" }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid oklch(20% 0.006 85)",
          background: "oklch(10% 0.008 85 / 0.9)",
          backdropFilter: "blur(12px)",
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 flex items-center justify-center text-xs font-semibold"
              style={{ background: "oklch(78% 0.15 85)", color: "oklch(10% 0.008 85)", borderRadius: "2px" }}
            >
              L
            </div>
            <span className="font-medium text-sm tracking-wide" style={{ color: "oklch(97% 0.005 85)" }}>
              Loop
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-xs tracking-widest uppercase font-medium"
              style={{ color: "oklch(55% 0.007 85)" }}
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-xs tracking-widest uppercase font-medium"
              style={{ color: "oklch(55% 0.007 85)" }}
            >
              Features
            </a>
            <Link href="/dashboard" className="btn btn-primary py-2 px-5 text-xs">
              Launch App
            </Link>
          </nav>

          <Link href="/dashboard" className="md:hidden btn btn-primary py-2 px-4 text-xs">
            Launch
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex-1 flex items-center">
        <StaticGrid />
        <div
          className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(78% 0.15 85 / 0.06) 0%, transparent 70%)" }}
        />
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-24 md:py-40 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-8">
              <FadeUp delay={0}>
                <span
                  className="badge"
                  style={{
                    color: "oklch(78% 0.15 85)",
                    borderColor: "oklch(78% 0.15 85 / 0.3)",
                    background: "oklch(78% 0.15 85 / 0.08)",
                  }}
                >
                  Stellar Testnet
                </span>
              </FadeUp>

              <FadeUp delay={0.08}>
                <h1
                  className="text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.05] tracking-[-0.03em]"
                  style={{ color: "oklch(97% 0.005 85)" }}
                >
                  Rotating savings,
                  <br />
                  <span style={{ color: "oklch(78% 0.15 85)" }}>on-chain.</span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.16}>
                <p
                  className="text-base max-w-[52ch] font-light leading-relaxed"
                  style={{ color: "oklch(65% 0.008 85)" }}
                >
                  Loop is a trustless ROSCA platform on Stellar Soroban. Pool
                  funds with your circle, take turns receiving the full pot — no
                  middlemen, no trust required.
                </p>
              </FadeUp>

              <FadeUp delay={0.24}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard" className="btn btn-primary px-7 py-3">
                    Open Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/create" className="btn btn-secondary px-7 py-3">
                    Start a Circle
                  </Link>
                </div>
              </FadeUp>

              <FadeUp delay={0.32}>
                <div className="flex flex-wrap gap-8 pt-2">
                  {[
                    { label: "Transaction fee", value: "<$0.001" },
                    { label: "Settlement time", value: "~5 sec" },
                    { label: "Custodians", value: "Zero" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-light tracking-tight" style={{ color: "oklch(97% 0.005 85)" }}>
                        {stat.value}
                      </div>
                      <div className="text-[11px] uppercase tracking-widest font-medium mt-0.5" style={{ color: "oklch(45% 0.005 85)" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* Right: Cycle diagram */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            >
              <div
                className="relative aspect-square max-w-[360px] mx-auto"
                style={{ border: "1px solid oklch(20% 0.006 85)", borderRadius: "4px", padding: "32px" }}
              >
                <div className="absolute inset-8 rounded-full" style={{ border: "1px solid oklch(20% 0.006 85)" }} />
                <div className="absolute inset-16 rounded-full" style={{ border: "1px dashed oklch(78% 0.15 85 / 0.25)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-sm font-semibold"
                    style={{ background: "oklch(78% 0.15 85)", color: "oklch(10% 0.008 85)", borderRadius: "2px" }}
                  >
                    Pool
                  </div>
                </div>
                {[0, 72, 144, 216, 288].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  const r = 38;
                  const x = 50 + r * Math.cos(rad - Math.PI / 2);
                  const y = 50 + r * Math.sin(rad - Math.PI / 2);
                  return (
                    <div
                      key={deg}
                      className="absolute w-8 h-8 flex items-center justify-center text-[10px] font-medium"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                        background: i === 0 ? "oklch(78% 0.15 85)" : "oklch(17% 0.008 85)",
                        color: i === 0 ? "oklch(10% 0.008 85)" : "oklch(55% 0.007 85)",
                        border: `1px solid ${i === 0 ? "oklch(78% 0.15 85)" : "oklch(25% 0.007 85)"}`,
                        borderRadius: "2px",
                      }}
                    >
                      M{i + 1}
                    </div>
                  );
                })}
                <div
                  className="absolute bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: "oklch(38% 0.005 85)" }}
                >
                  Rotating recipient order
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{ borderTop: "1px solid oklch(20% 0.006 85)", background: "oklch(11.5% 0.008 85)" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
            <div className="md:col-span-4">
              <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: "oklch(78% 0.15 85)" }}>
                The loop
              </p>
              <h2 className="text-3xl font-light mt-2" style={{ color: "oklch(97% 0.005 85)" }}>
                How it works
              </h2>
            </div>
            <div className="md:col-span-8">
              <p className="text-sm font-light leading-relaxed" style={{ color: "oklch(60% 0.007 85)" }}>
                ROSCA — Rotating Savings and Credit Associations — is a centuries-old
                community finance model. Loop brings it on-chain, removing the need
                for trust between participants.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "oklch(20% 0.006 85)" }}>
            {[
              { n: "01", title: "Form a circle", body: "Define members, contribution amount (XLM), and cycle length in ledgers. Deploy the Soroban contract." },
              { n: "02", title: "Everyone deposits", body: "Every member calls contribute(). The contract holds funds until all deposits are received." },
              { n: "03", title: "Payout rotates", body: "Once the cycle closes, the full pool is released to the designated recipient. Next cycle begins." },
            ].map((step) => (
              <div key={step.n} className="p-8 space-y-4" style={{ background: "oklch(11.5% 0.008 85)" }}>
                <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "oklch(78% 0.15 85)" }}>
                  {step.n}
                </div>
                <h3 className="text-lg font-light" style={{ color: "oklch(97% 0.005 85)" }}>{step.title}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "oklch(58% 0.007 85)" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ borderTop: "1px solid oklch(20% 0.006 85)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-24">
          <p className="text-[11px] uppercase tracking-widest font-medium mb-12" style={{ color: "oklch(78% 0.15 85)" }}>
            Why Loop
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "oklch(20% 0.006 85)" }}>
            {[
              { icon: "◈", title: "Soroban smart contracts", body: "All escrow logic lives on-chain. No admin keys, no multisig, no custodian risk." },
              { icon: "◐", title: "Mock simulator", body: "Test the full cycle flow instantly in your browser — no wallet, no testnet XLM required." },
              { icon: "◆", title: "Stellar native", body: "Sub-cent fees, 5-second finality, native XLM contributions. Integrates with Freighter." },
              { icon: "◉", title: "Live activity log", body: "Watch contributions and payouts stream in real-time across the dashboard." },
              { icon: "◪", title: "Open participation", body: "Any Stellar public key can join a circle. No KYC, no platform account required." },
              { icon: "◧", title: "Deterministic order", body: "Payout order is locked at circle creation. No randomness, no disputes." },
            ].map((f) => (
              <div key={f.title} className="p-8 space-y-3" style={{ background: "oklch(10% 0.008 85)" }}>
                <div className="text-xl" style={{ color: "oklch(78% 0.15 85)" }}>{f.icon}</div>
                <h3 className="text-base font-normal" style={{ color: "oklch(97% 0.005 85)" }}>{f.title}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "oklch(55% 0.007 85)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid oklch(20% 0.006 85)", background: "oklch(11.5% 0.008 85)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <h2 className="text-3xl md:text-4xl font-light" style={{ color: "oklch(97% 0.005 85)" }}>
                Start your first circle today.
              </h2>
              <p className="text-sm font-light" style={{ color: "oklch(55% 0.007 85)" }}>
                Try the simulator — no wallet needed.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-wrap gap-3 md:justify-end">
              <Link href="/dashboard" className="btn btn-primary px-7 py-3">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid oklch(20% 0.006 85)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 flex items-center justify-center text-[11px] font-semibold"
              style={{ background: "oklch(78% 0.15 85)", color: "oklch(10% 0.008 85)", borderRadius: "2px" }}
            >
              L
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(45% 0.005 85)" }}>
              Loop Savings Circle — Stellar Soroban
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noreferrer"
              className="text-xs flex items-center gap-1"
              style={{ color: "oklch(45% 0.005 85)" }}
            >
              Stellar Explorer
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <Link href="/settings" className="text-xs" style={{ color: "oklch(45% 0.005 85)" }}>
              Config
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
