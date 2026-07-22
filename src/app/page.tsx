"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/* ─── design tokens ─────────────────────────────────────────── */
const T = {
  bg: "#080707",
  line: "#1c1c1f",
  lineHi: "#28282d",
  gold: "oklch(78% 0.15 85)",
  goldDim: "oklch(78% 0.15 85 / 0.09)",
  text1: "oklch(95% 0.004 85)",
  text2: "oklch(56% 0.007 85)",
  text3: "oklch(33% 0.005 85)",
};

/* ─── ticker tape ────────────────────────────────────────────── */
function TickerLine() {
  const items = ["STELLAR SOROBAN", "TRUSTLESS ESCROW", "5-SECOND FINALITY", "SUB-CENT FEES", "NO CUSTODIANS", "OPEN SOURCE", "ROTATING SAVINGS"];
  const repeated = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden" style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-5 py-3 text-[9px] tracking-[0.2em] uppercase font-semibold shrink-0"
            style={{ color: T.text3 }}>
            <span className="w-[3px] h-[3px] rounded-full shrink-0" style={{ background: T.gold, opacity: 0.4 }} />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── utils ──────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className, style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className} style={style}
    >
      {children}
    </motion.div>
  );
}

function StaticGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      opacity: 0.02,
      backgroundImage: "linear-gradient(oklch(78% 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(78% 0.15 85) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
    }} />
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  const faqs = [
    ["What is Loop?", "Loop is a group savings circle powered by Stellar smart contracts."],
    ["Do I need a wallet?", "Yes. Connect a supported Stellar wallet to create circles and sign contributions."],
    ["What happens if someone misses a payment?", "The cycle stays locked until every member contributes. The contract does not release a partial payout."],
    ["Can I see my transactions?", "Yes. Open Activity, switch to My Activity, or download the visible history as a CSV."],
  ];

  return (
    <section id="faq" style={{ borderTop: `1px solid ${T.line}`, background: T.bg }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="text-[11px] uppercase tracking-widest font-medium mb-4" style={{ color: T.gold }}>FAQ</p>
          <h2 className="text-3xl md:text-4xl font-light leading-tight mb-5" style={{ color: T.text1 }}>Good to know before you start.</h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: T.text2 }}>Simple answers about wallets, contributions, and activity in a Loop circle.</p>
        </div>
        <div className="md:col-span-8" style={{ borderTop: `1px solid ${T.lineHi}` }}>
          {faqs.map(([question, answer], index) => (
            <div key={question} style={{ borderBottom: `1px solid ${T.lineHi}` }}>
              <button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index} className="w-full flex items-center justify-between gap-6 py-6 text-left cursor-pointer">
                <span className="flex items-center gap-4"><span className="text-[10px] tracking-widest" style={{ color: T.gold }}>0{index + 1}</span><span className="text-sm font-medium" style={{ color: T.text1 }}>{question}</span></span>
                <span className="text-xl font-light shrink-0" style={{ color: T.gold }}>{open === index ? "−" : "+"}</span>
              </button>
              {open === index && <p className="pl-10 pr-8 pb-6 text-sm leading-relaxed" style={{ color: T.text2 }}>{answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.bg, color: T.text1 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="fixed w-full top-0 z-50" style={{
        borderBottom: `1px solid ${T.line}`,
        background: `${T.bg}e6`,
        backdropFilter: "blur(14px)",
      }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Loop" width={26} height={26} style={{ width: "auto", height: "auto", borderRadius: "2px" }} />
            <span className="text-sm font-medium tracking-wide" style={{ color: T.text1 }}>Loop</span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {[["#how-it-works", "How it works"], ["#features", "Features"], ["#roadmap", "Roadmap"]].map(([href, label]) => (
              <a key={href} href={href} className="text-[11px] tracking-[0.15em] uppercase font-medium transition-opacity hover:opacity-100"
                style={{ color: T.text3 }}>
                {label}
              </a>
            ))}
            <Link href="/dashboard" className="btn btn-primary py-2 px-5 text-[11px]">
              Launch App
            </Link>
          </nav>
          <Link href="/dashboard" className="md:hidden btn btn-primary py-2 px-4 text-xs">Launch</Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <StaticGrid />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 50% at 65% 40%, ${T.goldDim} 0%, transparent 80%)`,
        }} />

        <div className="relative w-full max-w-6xl mx-auto px-6 md:px-10" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>

          {/* Eyebrow */}
          <FadeUp delay={0}>
            <div className="flex items-center gap-2 mb-12">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.gold, boxShadow: `0 0 6px ${T.gold}` }} />
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: T.text3 }}>
                Live · Stellar Testnet · Soroban
              </span>
            </div>
          </FadeUp>

          {/* Two-column layout: copy left, stats right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-end mb-0">

            {/* Left — headline + sub + CTAs */}
            <div>
              {/* Headline */}
              <FadeUp delay={0.06}>
                <h1 style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", lineHeight: 0.92, letterSpacing: "-0.04em", marginBottom: "2rem" }}>
                  <span className="block font-light" style={{ color: T.text3 }}>Rotating</span>
                  <span className="block font-bold" style={{ color: T.text1, letterSpacing: "-0.05em" }}>SAVINGS</span>
                  <span className="block font-light" style={{ color: T.gold }}>on-chain.</span>
                </h1>
              </FadeUp>

              {/* Descriptor */}
              <FadeUp delay={0.13}>
                <p className="text-base font-light leading-relaxed mb-8" style={{ color: T.text2, maxWidth: "38ch" }}>
                  Pool XLM with your circle, take turns receiving the full pot.
                  Escrow enforced by Soroban contracts — no middlemen, no trust required.
                </p>
              </FadeUp>

              {/* CTAs */}
              <FadeUp delay={0.19}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard" className="btn btn-primary px-7 py-3 text-sm">
                    Launch App <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/create" className="btn btn-secondary px-7 py-3 text-sm">
                    Start a Circle
                  </Link>
                </div>
              </FadeUp>
            </div>

            {/* Right — stats */}
            <FadeUp delay={0.22}>
              <div className="grid grid-cols-2 gap-0 h-full" style={{ border: `1px solid ${T.line}` }}>
                {[
                  { static: "< $0.001", label: "Transaction fee", sub: "per operation" },
                  { static: "~5 sec", label: "Ledger finality", sub: "Stellar network" },
                  { static: "2", label: "Live contracts", sub: "pool + registry" },
                  { static: "Zero", label: "Custodians", sub: "non-custodial" },
                ].map((s, i) => (
                  <div key={i} className="p-6 flex flex-col gap-1.5"
                    style={{
                      borderRight: i % 2 === 0 ? `1px solid ${T.line}` : undefined,
                      borderBottom: i < 2 ? `1px solid ${T.line}` : undefined,
                    }}>
                    <span className="text-2xl font-light tabular-nums" style={{ color: T.text1, letterSpacing: "-0.02em" }}>
                      {s.static}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-widest leading-tight" style={{ color: T.text2 }}>{s.label}</span>
                    <span className="text-[10px]" style={{ color: T.text3 }}>{s.sub}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Ticker */}
          <FadeUp delay={0.26}>
            <div className="mt-12">
              <TickerLine />
            </div>
          </FadeUp>

          {/* Contract address bar */}
          <FadeUp delay={0.34}>
            <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: `1px solid ${T.line}` }}>
              <span className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5"
                style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.gold}33`, borderRadius: "2px" }}>
                Pool
              </span>
              <span className="text-[10px] font-mono truncate" style={{ color: T.text3 }}>
                CCDEDVFTT6C6YEJC472HVJJLP3U25CX5GJCL7VTDOV753IMUJ5EKXVTV
              </span>
              <a
                href="https://stellar.expert/explorer/testnet/contract/CCDEDVFTT6C6YEJC472HVJJLP3U25CX5GJCL7VTDOV753IMUJ5EKXVTV"
                target="_blank" rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: T.gold }}
              >
                Explorer <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </FadeUp>

        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" style={{ borderTop: `1px solid ${T.line}`, background: "oklch(12% 0.008 85)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24">
          <p className="text-[11px] uppercase tracking-widest font-medium mb-4" style={{ color: T.gold }}>
            The loop
          </p>
          <h2 className="text-3xl font-light mb-16" style={{ color: T.text1 }}>
            How it works
          </h2>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {[
                { n: "01", title: "Form a circle", body: "Connect your wallet, add member addresses, set a contribution amount and cycle length. Submit to register members and initialise the on-chain pool.", filled: true },
                { n: "02", title: "Everyone contributes", body: "Each member visits the dashboard and calls contribute(). The Soroban contract holds the funds until every member has paid in.", filled: false },
                { n: "03", title: "Payout rotates", body: "Once all contributions are in, anyone can trigger the payout. The full pot goes to that cycle's recipient and the next cycle begins automatically.", filled: false },
              ].map((step, i) => (
                <div key={step.n} className="relative">
                  {/* Badge */}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div
                      className="w-12 h-12 flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{
                        background: i === 0 ? T.gold : i === 1 ? `${T.gold}18` : "transparent",
                        color: i === 0 ? T.bg : T.gold,
                        border: `1px solid ${i === 0 ? "transparent" : i === 1 ? `${T.gold}55` : `${T.gold}28`}`,
                        borderRadius: "2px",
                      }}
                    >
                      {step.n}
                    </div>
                    {/* Step progress dots */}
                    <div className="hidden md:flex gap-1">
                      {[0, 1, 2].map((dot) => (
                        <div key={dot} className="rounded-full"
                          style={{
                            width: dot <= i ? "16px" : "4px",
                            height: "3px",
                            background: dot <= i ? T.gold : `${T.gold}22`,
                            transition: "all 0.3s",
                          }} />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-lg font-normal mb-3" style={{ color: T.text1 }}>{step.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: T.text2 }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 pt-8" style={{ borderTop: `1px solid ${T.line}` }}>
            <p className="text-xs font-light leading-relaxed max-w-[70ch]" style={{ color: T.text3 }}>
              ROSCA — Rotating Savings and Credit Associations — is a centuries-old community finance model. Loop brings it on-chain, removing the need for trust between participants.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" style={{ borderTop: `1px solid ${T.line}`, background: "oklch(12% 0.008 85)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: T.gold }}>
                Why Loop
              </p>
              <h2 className="text-4xl font-light leading-tight" style={{ color: T.text1 }}>
                Built on<br />
                <span style={{ color: T.gold }}>trust-less</span><br />
                rails.
              </h2>
              <p className="text-sm font-light leading-relaxed" style={{ color: T.text2 }}>
                Every rule — who contributes, who receives, in what order — is enforced by Soroban contracts on Stellar. No platform account. No custodian.
              </p>
              <Link href="/create" className="btn btn-secondary px-6 py-2.5 text-xs inline-flex">
                Start a circle <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="lg:col-span-8" style={{ borderTop: `1px solid ${T.lineHi}` }}>
              {[
                { icon: "◈", title: "Soroban smart contracts", body: "All escrow logic lives on-chain. No admin keys, no multisig, no custodian risk." },
                { icon: "◆", title: "Stellar native", body: "Sub-cent fees, 5-second finality, native XLM contributions on the Stellar testnet." },
                { icon: "◉", title: "Live activity log", body: "Contributions and payouts surface in real-time on the dashboard, each linked to its on-chain transaction." },
                { icon: "◐", title: "Multi-wallet support", body: "Connect with Freighter, Lobstr, xBull or any wallet supported by Stellar Wallets Kit — no lock-in." },
                { icon: "◧", title: "Deterministic order", body: "Payout order is locked at circle creation. No randomness, no disputes." },
                { icon: "◪", title: "Creator-defined membership", body: "The circle creator sets the member list and contribution amount. Every participant is known before any funds move." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-6 py-6" style={{ borderBottom: `1px solid ${T.lineHi}` }}>
                  <span className="text-lg mt-0.5 shrink-0 w-6 text-center" style={{ color: T.gold }}>{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium mb-1" style={{ color: "oklch(92% 0.005 85)" }}>{f.title}</h3>
                    <p className="text-sm font-light leading-relaxed" style={{ color: T.text2 }}>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqSection />
      {/* ── Roadmap ───────────────────────────────────────────── */}
      <section id="roadmap" style={{ borderTop: `1px solid ${T.line}`, background: T.bg }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-24">
          <p className="text-[11px] uppercase tracking-widest font-medium mb-4" style={{ color: T.gold }}>
            What&apos;s next
          </p>
          <h2 className="text-3xl font-light mb-16" style={{ color: T.text1 }}>Future plan</h2>
          <div>
            {[
              {
                phase: "Near-term", phaseColor: T.gold,
                items: [
                  { title: "Scheduled payouts", body: "Trigger payouts automatically via a Stellar ledger time condition — no manual invocation required." },
                  { title: "Push notifications", body: "Webhook-driven alerts when a contribution is received, a payout is triggered, or a new cycle starts." },
                  { title: "Circle invitations", body: "Off-chain invite links that pre-register a member's key to a pending circle before deployment." },
                ],
              },
              {
                phase: "Mid-term", phaseColor: "oklch(70% 0.10 85)",
                items: [
                  { title: "Multi-circle support", body: "A single wallet participates in multiple independent circles simultaneously, each tracked separately." },
                  { title: "Contribution history export", body: "Download a full CSV of all cycle activity — contributions, payouts, timestamps, transaction hashes." },
                ],
              },
              {
                phase: "Long-term", phaseColor: "oklch(48% 0.007 85)",
                items: [
                  { title: "Mainnet deployment", body: "Configuration toggle to switch from Testnet to Mainnet with real XLM, with appropriate safety warnings." },
                ],
              },
            ].map((phase, pi) => (
              <div key={phase.phase} className="grid grid-cols-1 md:grid-cols-12" style={{ borderTop: `1px solid ${T.line}` }}>
                <div className="md:col-span-3 py-8 pr-8 flex items-start">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: phase.phaseColor }}>
                    {phase.phase}
                  </span>
                </div>
                <div className="md:col-span-9">
                  {phase.items.map((item, ii) => (
                    <div key={item.title} className="flex items-start gap-4 py-8"
                      style={{ borderTop: ii > 0 ? `1px solid ${T.line}` : undefined }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: phase.phaseColor, opacity: 1 - pi * 0.22 }} />
                      <div>
                        <h3 className="text-sm font-medium mb-1.5" style={{ color: "oklch(92% 0.005 85)" }}>{item.title}</h3>
                        <p className="text-sm font-light leading-relaxed" style={{ color: T.text2 }}>{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.line}` }} />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${T.line}`, background: T.gold }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight" style={{ color: T.bg }}>
            Start your first circle.
          </h2>
          <p className="text-sm font-light" style={{ color: "oklch(22% 0.01 85)" }}>
            Connect your wallet and start saving with your circle on Stellar testnet.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link href="/dashboard" className="flex items-center gap-2 px-7 py-3 text-sm font-medium"
              style={{ background: T.bg, color: T.text1, borderRadius: "2px" }}>
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/create" className="flex items-center gap-2 px-7 py-3 text-sm font-medium"
              style={{ background: "transparent", color: T.bg, border: `1px solid ${T.bg}44`, borderRadius: "2px" }}>
              Start a Circle
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${T.line}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Loop" width={22} height={22} style={{ width: "auto", height: "auto", borderRadius: "2px" }} />
            <span className="text-xs font-medium" style={{ color: T.text3 }}>
              Loop Savings Circle — Stellar Soroban
            </span>
          </div>
          <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer"
            className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: T.text3 }}>
            Stellar Explorer <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </footer>

    </div>
  );
}
