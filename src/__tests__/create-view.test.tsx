/**
 * Frontend tests: contribution form validation (CreateView)
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Hoist mocks (required so vi.mock factory can access the variables) ─────────
const { mockAddToast, mockCreateCircle, mockRouterPush } = vi.hoisted(() => ({
  mockAddToast: vi.fn(),
  mockCreateCircle: vi.fn().mockResolvedValue(undefined),
  mockRouterPush: vi.fn(),
}));

// ── Module mocks ───────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

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
  useCircle: () => ({
    createCircle: mockCreateCircle,
    publicKey: "",
    addToast: mockAddToast,
  }),
}));

// ── Component import (after mocks) ────────────────────────────────────────────
import { CreateView } from "@/components/create-view";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("CreateView – contribution form", () => {
  beforeEach(() => {
    mockAddToast.mockClear();
    mockCreateCircle.mockClear();
    mockRouterPush.mockClear();
    mockCreateCircle.mockResolvedValue(undefined);
  });

  it("renders contribution amount and cycle length inputs with defaults", () => {
    render(<CreateView />);
    const amountInput = screen.getByPlaceholderText("100") as HTMLInputElement;
    const lengthInput = screen.getByPlaceholderText("10") as HTMLInputElement;
    expect(amountInput.value).toBe("100");
    expect(lengthInput.value).toBe("10");
  });

  it("renders the Create Circle button", () => {
    render(<CreateView />);
    expect(screen.getByRole("button", { name: /create circle/i })).toBeInTheDocument();
  });

  it("adds a valid Stellar public key to the member list", () => {
    render(<CreateView />);

    const validKey = "GVALIDKEY12";
    const input = screen.getByPlaceholderText(/stellar public key/i);

    fireEvent.change(input, { target: { value: validKey } });
    fireEvent.click(screen.getByTestId("add-member-btn"));

    expect(mockAddToast).toHaveBeenCalledWith("Member added to list", "success");
    expect(screen.getByText(validKey)).toBeInTheDocument();
  });

  it("rejects an address that does not start with G or is too short", () => {
    render(<CreateView />);

    const input = screen.getByPlaceholderText(/stellar public key/i);
    fireEvent.change(input, { target: { value: "XSHORT" } });
    fireEvent.click(screen.getByTestId("add-member-btn"));

    expect(mockAddToast).toHaveBeenCalledWith(
      "Invalid Stellar address format",
      "error"
    );
  });

  it("rejects a duplicate address", () => {
    render(<CreateView />);

    const duplicateKey = "GB7VKJ...3M6K7";
    const input = screen.getByPlaceholderText(/stellar public key/i);
    fireEvent.change(input, { target: { value: duplicateKey } });
    fireEvent.click(screen.getByTestId("add-member-btn"));

    expect(mockAddToast).toHaveBeenCalledWith("Member already added", "error");
  });

  it("removes a member when the delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<CreateView />);

    const target = "GCOO4S...XS4X8";
    expect(screen.getByText(target)).toBeInTheDocument();

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector('[data-icon="Trash2"]'));

    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText(target)).not.toBeInTheDocument();
    });
    expect(mockAddToast).toHaveBeenCalledWith("Member removed", "info");
  });

  it("blocks circle creation when fewer than 2 members remain", async () => {
    const user = userEvent.setup();
    render(<CreateView />);

    // Remove 3 of 4 default members
    for (let i = 0; i < 3; i++) {
      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.querySelector('[data-icon="Trash2"]'));
      await user.click(deleteButtons[deleteButtons.length - 1]);
    }

    await user.click(screen.getByRole("button", { name: /create circle/i }));

    expect(mockAddToast).toHaveBeenCalledWith(
      "Savings circle must have at least 2 members",
      "error"
    );
    expect(mockCreateCircle).not.toHaveBeenCalled();
  });

  it("calls createCircle with parsed values on valid submit", () => {
    render(<CreateView />);

    const amountInput = screen.getByPlaceholderText("100");
    fireEvent.change(amountInput, { target: { value: "250" } });

    fireEvent.click(screen.getByRole("button", { name: /create circle/i }));

    expect(mockCreateCircle).toHaveBeenCalledWith(
      expect.any(Array),
      250,
      expect.any(Number)
    );
  });
});
