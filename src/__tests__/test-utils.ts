/**
 * Shared test utilities and mock factories
 */
import React from "react";
import { vi } from "vitest";

// ── framer-motion ─────────────────────────────────────────────────────────────
export function mockFramerMotion() {
  vi.mock("framer-motion", () => ({
    motion: new Proxy(
      {},
      {
        get:
          (_t, tag: string) =>
          ({
            children,
            ...props
          }: React.HTMLAttributes<HTMLElement> & {
            children?: React.ReactNode;
          }) =>
            React.createElement(tag as string, props, children),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }));
}

// ── lucide-react – use importOriginal but override with stubs ─────────────────
export function mockLucide() {
  vi.mock("lucide-react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("lucide-react")>();
    // Override every icon with a simple span stub
    const stubs: Record<string, unknown> = {};
    for (const key of Object.keys(actual)) {
      stubs[key] = (props: Record<string, unknown>) =>
        React.createElement("span", { "data-icon": key, ...props });
    }
    return stubs;
  });
}
