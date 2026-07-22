"use client";

import { useEffect, useState } from "react";
import { Account, Operation, rpc, scValToNative, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { rpcServer, STELLAR_NETWORK_PASSPHRASE } from "@/lib/stellar";
import { ArrowUpRight, BarChart3, CircleAlert, Coins, Users } from "lucide-react";

type CircleRef = { pool: string; registry: string; creator: string };
type Activity = { type: "contribute" | "payout" | "circle_created"; hash?: string; pool: string; ledger?: number; member?: string; cycle?: number };
type RawEvent = { topic?: xdr.ScVal[]; value?: xdr.ScVal; contractId?: unknown; txHash?: string; ledger?: number };

const FACTORY = process.env.NEXT_PUBLIC_SOROBAN_FACTORY_CONTRACT_ID || "";
const READ_SOURCE = "GCQKBI3RFBB7N73FLCG2IHSX57LF5RN7J4OBONRDBKCHP7P2YG45OZ43";
const S = { bg: "oklch(13% 0.008 85)", border: "oklch(20% 0.006 85)", text: "oklch(95% 0.005 85)", muted: "oklch(56% 0.007 85)", gold: "oklch(78% 0.15 85)" };
const short = (value: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";

async function readFactoryCircles() {
  const account = new Account(READ_SOURCE, "0");
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: STELLAR_NETWORK_PASSPHRASE }).addOperation(Operation.invokeContractFunction({ contract: FACTORY, function: "get_circles", args: [] })).setTimeout(30).build();
  const simulation = await rpcServer.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) throw new Error("Factory data could not be read");
  return scValToNative(simulation.result.retval) as CircleRef[];
}

function parseEvents(events: RawEvent[]) {
  const rows: Activity[] = [];
  for (const event of events) {
    try {
      const type = event.topic?.[0] ? scValToNative(event.topic[0]) : "";
      if (type !== "circle_created" && type !== "contribute" && type !== "payout") continue;
      rows.push({ type, pool: String(event.contractId || ""), hash: event.txHash, ledger: event.ledger, member: event.topic?.[1] ? scValToNative(event.topic[1]) : undefined, cycle: event.value ? Number(scValToNative(event.value)) : undefined });
    } catch { /* Ignore malformed historical events. */ }
  }
  return rows;
}

async function fetchActivityPage(pools: string[], cursor?: string, limit = 15) {
  const request = cursor ? { cursor, filters: [{ type: "contract" as const, contractIds: pools }], limit } : { startLedger: Math.max(1, (await rpcServer.getLatestLedger()).sequence - 10000), filters: [{ type: "contract" as const, contractIds: pools }], limit };
  const response = await rpcServer.getEvents(request);
  return { items: parseEvents(response.events as RawEvent[]).reverse(), cursor: response.cursor };
}

function ActivityRows({ activity, compact = false }: { activity: Activity[]; compact?: boolean }) {
  return <div>{activity.slice(0, compact ? 5 : undefined).map((item, index) => <div key={`${item.hash}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}><div><p className="text-sm capitalize" style={{ color: S.text }}>{item.type.replace("_", " ")}</p><p className="text-xs mt-1" style={{ color: S.muted }}>Pool {short(item.pool)}{item.member ? ` · ${short(item.member)}` : ""}{item.cycle !== undefined ? ` · Cycle ${item.cycle}` : ""}</p></div>{item.hash && <a href={`https://stellar.expert/explorer/testnet/tx/${item.hash}`} target="_blank" rel="noreferrer" style={{ color: S.gold }}><ArrowUpRight className="w-4 h-4" /></a>}</div>)}</div>;
}

export function FactoryActivityPreview() {
  const [activity, setActivity] = useState<Activity[]>([]);
  useEffect(() => { if (!FACTORY) return; void (async () => { const circles = await readFactoryCircles(); if (circles.length) setActivity((await fetchActivityPage(circles.map((circle) => circle.pool), undefined, 5)).items); })().catch(() => undefined); }, []);
  return <section style={{ borderTop: `1px solid ${S.border}`, background: "#080707" }}><div className="max-w-6xl mx-auto px-6 md:px-10 py-20"><div className="flex items-end justify-between gap-4 mb-8"><div><p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: S.gold }}>Live activity</p><h2 className="text-3xl font-light" style={{ color: S.text }}>See the network move.</h2></div><a href="/analytics" className="text-xs uppercase tracking-widest" style={{ color: S.gold }}>View analytics <ArrowUpRight className="inline w-3 h-3" /></a></div><div className="max-w-3xl" style={{ border: `1px solid ${S.border}`, background: S.bg }}>{activity.length ? <ActivityRows activity={activity} compact /> : <p className="p-6 text-sm" style={{ color: S.muted }}>Loading recent activity…</p>}</div></div></section>;
}

export function FactoryAnalytics() {
  const [circles, setCircles] = useState<CircleRef[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!FACTORY) { setError("Circle factory is not configured."); setLoading(false); return; } void (async () => { try { const nextCircles = await readFactoryCircles(); setCircles(nextCircles); if (nextCircles.length) { const page = await fetchActivityPage(nextCircles.map((circle) => circle.pool)); setActivity(page.items); setCursor(page.cursor); } } catch (cause) { setError(cause instanceof Error ? cause.message : "Analytics could not be loaded."); } finally { setLoading(false); } })(); }, []);

  const loadMore = async () => { if (!cursor || loadingMore || !circles.length) return; setLoadingMore(true); try { const page = await fetchActivityPage(circles.map((circle) => circle.pool), cursor); setActivity((previous) => [...previous, ...page.items]); setCursor(page.cursor); } finally { setLoadingMore(false); } };
  const contributions = activity.filter((item) => item.type === "contribute").length;
  const payouts = activity.filter((item) => item.type === "payout").length;
  const stats = [{ label: "Circles tracked", value: circles.length, Icon: BarChart3 }, { label: "Loaded contributions", value: contributions, Icon: Coins }, { label: "Loaded payouts", value: payouts, Icon: Users }];
  return <main className="max-w-6xl mx-auto px-6 md:px-8 py-10 space-y-8"><div><p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: S.gold }}>Public analytics</p><h1 className="text-3xl font-light" style={{ color: S.text }}>Circle Factory Activity</h1><p className="text-sm mt-2" style={{ color: S.muted }}>Activity from every factory-managed circle. Wallet connection is not required.</p></div>{error && <div className="flex items-center gap-2 p-4 text-sm" style={{ color: "oklch(70% 0.14 20)", background: S.bg, border: `1px solid ${S.border}` }}><CircleAlert className="w-4 h-4" />{error}</div>}<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{stats.map(({ label, value, Icon }) => <div key={label} className="p-5" style={{ background: S.bg, border: `1px solid ${S.border}` }}><Icon className="w-4 h-4 mb-5" style={{ color: S.gold }} /><p className="text-3xl font-light" style={{ color: S.text }}>{loading ? "—" : value}</p><p className="text-[10px] uppercase tracking-widest mt-2" style={{ color: S.muted }}>{label}</p></div>)}</div><section style={{ background: S.bg, border: `1px solid ${S.border}` }}><div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}><p className="text-xs uppercase tracking-widest" style={{ color: S.muted }}>Recent factory activity · 15 per page</p></div>{loading ? <p className="p-6 text-sm" style={{ color: S.muted }}>Reading factory and pool events…</p> : activity.length === 0 ? <p className="p-6 text-sm" style={{ color: S.muted }}>No activity found yet.</p> : <><ActivityRows activity={activity} />{cursor && <button onClick={loadMore} disabled={loadingMore} className="w-full px-5 py-4 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-40" style={{ color: S.gold }}>{loadingMore ? "Loading…" : "Load more activity"}</button>}</>}</section></main>;
}
