/**
 * Frontend tests: ActivityView rendering
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const { mockContribute, mockTriggerPayout, mockSetAutoSimulate, mockUseCircle } =
  vi.hoisted(() => {
    const mockContribute = vi.fn();
    const mockTriggerPayout = vi.fn();
    const mockSetAutoSimulate = vi.fn();

    const baseState = {
      publicKey: "GTEST1234567890ABCDEF",
      balance: "1000",
      members: ["GABC...1", "GDEF...2", "GHIJ...3"],
      contributionAmount: 100,
      currentCycle: 2,
      contributedThisCycle: ["GABC...1"],
      nextPayoutRecipient: "GDEF...2",
      pendingTx: false,
      transactions: [] as unknown[],
      autoSimulate: false,
      mode: "mock" as const,
      contribute: mockContribute,
      triggerPayout: mockTriggerPayout,
      setAutoSimulate: mockSetAutoSimulate,
    };

    const mockUseCircle = vi.fn(() => baseState);
    return { mockContribute, mockTriggerPayout, mockSetAutoSimulate, mockUseCircle };
  });

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get:
          (_t, tag: string) =>
          ({
            children,
            ...props
          }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
            React.createElement(tag as string, props, children),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  const stubs: Record<string, (p: Record<string, unknown>) => React.ReactElement> = {};
  for (const key of Object.keys(actual)) {
    stubs[key] = (props) =>
      React.createElement("span", { "data-icon": key, ...props });
  }
  return stubs;
});

vi.mock("@/lib/circle-context", () => ({
  useCircle: () => mockUseCircle(),
}));

// ── Component import ──────────────────────────────────────────────────────────
import { ActivityView } from "@/components/activity-view";

// Convenient base state for use in tests
const baseState = {
  publicKey: "GTEST1234567890ABCDEF",
  balance: "1000",
  members: ["GABC...1", "GDEF...2", "GHIJ...3"],
  contributionAmount: 100,
  currentCycle: 2,
  contributedThisCycle: ["GABC...1"],
  nextPayoutRecipient: "GDEF...2",
  pendingTx: false,
  transactions: [] as unknown[],
  autoSimulate: false,
  mode: "mock" as const,
  contribute: mockContribute,
  triggerPayout: mockTriggerPayout,
  setAutoSimulate: mockSetAutoSimulate,
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("ActivityView – rendering", () => {
  beforeEach(() => {
    mockContribute.mockClear();
    mockTriggerPayout.mockClear();
    mockSetAutoSimulate.mockClear();
    mockUseCircle.mockClear();
    mockUseCircle.mockReturnValue(baseState);
  });

  it("renders the activity / transaction section heading", () => {
    render(<ActivityView />);
    expect(screen.getAllByText(/activity/i).length).toBeGreaterThan(0);
  });

  it("shows an empty-state indicator when there are no transactions", () => {
    render(<ActivityView />);
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });

  it("renders transaction type labels when transactions exist", () => {
    mockUseCircle.mockReturnValue({
      ...baseState,
      transactions: [
        {
          id: "tx1",
          type: "contribute",
          member: "GABC...1",
          amount: 100,
          cycleId: 2,
          status: "success",
          timestamp: Date.now(),
          hash: "tx_abc123",
        },
        {
          id: "tx2",
          type: "payout",
          member: "GDEF...2",
          amount: 300,
          cycleId: 1,
          status: "success",
          timestamp: Date.now() - 5000,
          hash: "tx_def456",
        },
      ],
    });

    render(<ActivityView />);
    expect(screen.getAllByText(/contribution/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/payout/i).length).toBeGreaterThan(0);
  });
});
