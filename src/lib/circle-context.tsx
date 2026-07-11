"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Transaction = {
  id: string;
  type: "create" | "contribute" | "payout";
  member?: string;
  amount?: number;
  cycleId: number;
  status: "pending" | "success" | "error";
  timestamp: number;
  hash?: string;
};

export type CircleState = {
  mode: "mock" | "soroban";
  publicKey: string;
  walletName: string;
  balance: string;
  poolContractId: string;
  registryContractId: string;
  tokenContractId: string;
  members: string[];
  contributionAmount: number;
  cycleLength: number;
  currentCycle: number;
  contributedThisCycle: string[];
  nextPayoutRecipient: string;
  loading: boolean;
  pendingTx: boolean;
  transactions: Transaction[];
  autoSimulate: boolean;
};

type CircleContextType = CircleState & {
  connect: (address: string, name: string, balance: string) => void;
  disconnect: () => void;
  updateBalance: (balance: string) => void;
  setMode: (mode: "mock" | "soroban") => void;
  setContracts: (pool: string, registry: string, token: string) => void;
  createCircle: (members: string[], amount: number, length: number) => Promise<void>;
  contribute: (member: string) => Promise<void>;
  triggerPayout: () => Promise<void>;
  setAutoSimulate: (simulate: boolean) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
};

const CircleContext = createContext<CircleContextType | undefined>(undefined);

const INITIAL_MOCK_MEMBERS = [
  "GB7V...M6K7",
  "GDFO...R4E2",
  "GATY...K9P1",
  "GCOO...S4X8",
];

export function CircleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CircleState>({
    mode: "mock",
    publicKey: "",
    walletName: "",
    balance: "0",
    poolContractId: "CC...POOL",
    registryContractId: "CC...REGISTRY",
    tokenContractId: "CC...TOKEN",
    members: INITIAL_MOCK_MEMBERS,
    contributionAmount: 100,
    cycleLength: 10,
    currentCycle: 0,
    contributedThisCycle: [],
    nextPayoutRecipient: INITIAL_MOCK_MEMBERS[0],
    loading: false,
    pendingTx: false,
    transactions: [],
    autoSimulate: false,
  });

  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const connect = (address: string, name: string, balance: string) => {
    setState((prev) => {
      let updatedMembers = [...prev.members];
      if (address && !updatedMembers.includes(address)) {
        updatedMembers.unshift(address);
      }
      // If we connected in Soroban mode, filter out mock members if any got in
      if (prev.mode === "soroban" && address) {
        updatedMembers = [address];
      }
      return {
        ...prev,
        publicKey: address,
        walletName: name,
        balance,
        members: updatedMembers,
        nextPayoutRecipient: updatedMembers[prev.currentCycle % updatedMembers.length] || "",
      };
    });
    addToast(`Connected with ${name}`, "success");
  };

  const disconnect = () => {
    setState((prev) => ({
      ...prev,
      publicKey: "",
      walletName: "",
      balance: "0",
      members: prev.mode === "soroban" ? [] : INITIAL_MOCK_MEMBERS,
      nextPayoutRecipient: prev.mode === "soroban" ? "" : INITIAL_MOCK_MEMBERS[0],
    }));
    addToast("Disconnected wallet", "info");
  };

  const updateBalance = (balance: string) => {
    setState((prev) => ({ ...prev, balance }));
  };

  const setMode = (mode: "mock" | "soroban") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stellar-loop-mode", mode);
    }
    setState((prev) => {
      if (mode === "soroban") {
        return {
          ...prev,
          mode,
          poolContractId: process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "",
          registryContractId: process.env.NEXT_PUBLIC_SOROBAN_REGISTRY_CONTRACT_ID || "",
          tokenContractId: process.env.NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID || "",
          members: prev.publicKey ? [prev.publicKey] : [],
          contributedThisCycle: [],
          nextPayoutRecipient: prev.publicKey || "",
          transactions: [],
        };
      } else {
        const mockMembers = prev.publicKey ? [prev.publicKey, ...INITIAL_MOCK_MEMBERS.filter(m => m !== prev.publicKey)] : INITIAL_MOCK_MEMBERS;
        return {
          ...prev,
          mode,
          poolContractId: "CC...POOL",
          registryContractId: "CC...REGISTRY",
          tokenContractId: "CC...TOKEN",
          members: mockMembers,
          nextPayoutRecipient: mockMembers[prev.currentCycle % mockMembers.length] || "",
          transactions: [],
        };
      }
    });
    addToast(`Switched to ${mode} mode`, "info");
  };

  const setContracts = (pool: string, registry: string, token: string) => {
    setState((prev) => ({
      ...prev,
      poolContractId: pool,
      registryContractId: registry,
      tokenContractId: token,
    }));
    addToast("Contract configurations updated", "success");
  };

  const createCircle = async (members: string[], amount: number, length: number) => {
    setState((prev) => ({ ...prev, pendingTx: true }));
    
    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (state.mode === "mock") {
      setState((prev) => ({
        ...prev,
        members,
        contributionAmount: amount,
        cycleLength: length,
        currentCycle: 0,
        contributedThisCycle: [],
        nextPayoutRecipient: members[0],
        pendingTx: false,
        transactions: [
          {
            id: Math.random().toString(36).substr(2, 9),
            type: "create",
            amount,
            cycleId: 0,
            status: "success",
            timestamp: Date.now(),
            hash: "op_" + Math.random().toString(36).substr(2, 16),
          },
          ...prev.transactions,
        ],
      }));
      addToast("Savings circle created successfully!", "success");
    } else {
      // In real Soroban Mode, this is a placeholder for contract calls
      setState((prev) => ({ ...prev, pendingTx: false }));
      addToast("Soroban create_circle transaction submitted", "info");
    }
  };

  const contribute = async (memberAddress: string) => {
    setState((prev) => ({ ...prev, pendingTx: true }));
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (state.mode === "mock") {
      setState((prev) => {
        if (prev.contributedThisCycle.includes(memberAddress)) {
          addToast("Member has already contributed this cycle", "error");
          return { ...prev, pendingTx: false };
        }
        
        const updatedContributions = [...prev.contributedThisCycle, memberAddress];
        const txId = Math.random().toString(36).substr(2, 9);
        const newTx: Transaction = {
          id: txId,
          type: "contribute",
          member: memberAddress,
          amount: prev.contributionAmount,
          cycleId: prev.currentCycle,
          status: "success",
          timestamp: Date.now(),
          hash: "tx_" + Math.random().toString(36).substr(2, 16),
        };

        // Dispatch a mock window event so dashboard components can animate
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("circle-event", {
              detail: { type: "contribution", member: memberAddress, amount: prev.contributionAmount },
            })
          );
        }

        return {
          ...prev,
          contributedThisCycle: updatedContributions,
          pendingTx: false,
          balance: memberAddress === prev.publicKey ? (parseFloat(prev.balance) - prev.contributionAmount).toString() : prev.balance,
          transactions: [newTx, ...prev.transactions],
        };
      });
      addToast(`Contribution of ${state.contributionAmount} XLM recorded`, "success");
    } else {
      setState((prev) => ({ ...prev, pendingTx: false }));
      addToast("Soroban contribute transaction submitted", "info");
    }
  };

  const triggerPayout = useCallback(async () => {
    setState((prev) => ({ ...prev, pendingTx: true }));
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (state.mode === "mock") {
      let isSuccess = false;
      setState((prev) => {
        // Validate everyone contributed
        const allContributed = prev.members.every((m) => prev.contributedThisCycle.includes(m));
        if (!allContributed) {
          isSuccess = false;
          return { ...prev, pendingTx: false };
        }

        isSuccess = true;
        const totalPayout = prev.contributionAmount * prev.members.length;
        const recipient = prev.nextPayoutRecipient;
        const txId = Math.random().toString(36).substr(2, 9);
        
        const newTx: Transaction = {
          id: txId,
          type: "payout",
          member: recipient,
          amount: totalPayout,
          cycleId: prev.currentCycle,
          status: "success",
          timestamp: Date.now(),
          hash: "tx_" + Math.random().toString(36).substr(2, 16),
        };

        const nextCycle = prev.currentCycle + 1;

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("circle-event", {
              detail: { type: "payout", member: recipient, amount: totalPayout },
            })
          );
        }

        return {
          ...prev,
          currentCycle: nextCycle,
          contributedThisCycle: [],
          nextPayoutRecipient: prev.members[nextCycle % prev.members.length],
          balance: recipient === prev.publicKey ? (parseFloat(prev.balance) + totalPayout).toString() : prev.balance,
          pendingTx: false,
          transactions: [newTx, ...prev.transactions],
        };
      });

      if (isSuccess) {
        addToast(`Cycle payout released to recipient!`, "success");
      } else {
        addToast("Cannot release payout: not all members have contributed", "error");
      }
    } else {
      setState((prev) => ({ ...prev, pendingTx: false }));
      addToast("Soroban payout transaction submitted", "info");
    }
  }, [state.mode, addToast]);

  const setAutoSimulate = (simulate: boolean) => {
    setState((prev) => ({ ...prev, autoSimulate: simulate }));
    addToast(simulate ? "Auto-simulation active" : "Auto-simulation paused", "info");
  };

  // Background auto-simulation for other members contributing
  useEffect(() => {
    if (!state.autoSimulate || state.mode !== "mock") return;

    const interval = setInterval(() => {
      setState((prev) => {
        // Find other members who haven't contributed yet
        const nonContributors = prev.members.filter(
          (m) => m !== prev.publicKey && !prev.contributedThisCycle.includes(m)
        );

        if (nonContributors.length === 0) {
          // If everyone contributed, automatically trigger payout after a short delay
          clearInterval(interval);
          setTimeout(() => {
            triggerPayout();
          }, 1000);
          return prev;
        }

        // Pick a random member to contribute
        const randomMember = nonContributors[Math.floor(Math.random() * nonContributors.length)];
        const updatedContributions = [...prev.contributedThisCycle, randomMember];
        const txId = Math.random().toString(36).substr(2, 9);
        const newTx: Transaction = {
          id: txId,
          type: "contribute",
          member: randomMember,
          amount: prev.contributionAmount,
          cycleId: prev.currentCycle,
          status: "success",
          timestamp: Date.now(),
          hash: "tx_" + Math.random().toString(36).substr(2, 16),
        };

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("circle-event", {
              detail: { type: "contribution", member: randomMember, amount: prev.contributionAmount },
            })
          );
        }

        return {
          ...prev,
          contributedThisCycle: updatedContributions,
          transactions: [newTx, ...prev.transactions],
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [state.autoSimulate, state.contributedThisCycle, state.mode, triggerPayout]);

  // Save state to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stateToSave = {
        publicKey: state.publicKey,
        walletName: state.walletName,
        balance: state.balance,
        poolContractId: state.poolContractId,
        registryContractId: state.registryContractId,
        tokenContractId: state.tokenContractId,
        members: state.members,
        contributionAmount: state.contributionAmount,
        cycleLength: state.cycleLength,
        currentCycle: state.currentCycle,
        contributedThisCycle: state.contributedThisCycle,
        nextPayoutRecipient: state.nextPayoutRecipient,
        transactions: state.transactions,
        autoSimulate: state.autoSimulate,
      };
      localStorage.setItem("stellar-loop-circle-data", JSON.stringify(stateToSave));
    }
  }, [
    state.publicKey,
    state.walletName,
    state.balance,
    state.poolContractId,
    state.registryContractId,
    state.tokenContractId,
    state.members,
    state.contributionAmount,
    state.cycleLength,
    state.currentCycle,
    state.contributedThisCycle,
    state.nextPayoutRecipient,
    state.transactions,
    state.autoSimulate,
  ]);

  // Load mode and state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("stellar-loop-mode") as "mock" | "soroban" | null;
      const savedDataStr = localStorage.getItem("stellar-loop-circle-data");

      setState((prev) => {
        const updated = { ...prev };

        if (savedMode) {
          updated.mode = savedMode;
          if (savedMode === "soroban" && !savedDataStr) {
            updated.poolContractId = process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "";
            updated.registryContractId = process.env.NEXT_PUBLIC_SOROBAN_REGISTRY_CONTRACT_ID || "";
            updated.tokenContractId = process.env.NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID || "";
            updated.members = [];
            updated.nextPayoutRecipient = "";
          }
        }

        if (savedDataStr) {
          try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.publicKey !== undefined) updated.publicKey = savedData.publicKey;
            if (savedData.walletName !== undefined) updated.walletName = savedData.walletName;
            if (savedData.balance !== undefined) updated.balance = savedData.balance;
            if (savedData.poolContractId !== undefined) updated.poolContractId = savedData.poolContractId;
            if (savedData.registryContractId !== undefined) updated.registryContractId = savedData.registryContractId;
            if (savedData.tokenContractId !== undefined) updated.tokenContractId = savedData.tokenContractId;
            if (savedData.members !== undefined) updated.members = savedData.members;
            if (savedData.contributionAmount !== undefined) updated.contributionAmount = savedData.contributionAmount;
            if (savedData.cycleLength !== undefined) updated.cycleLength = savedData.cycleLength;
            if (savedData.currentCycle !== undefined) updated.currentCycle = savedData.currentCycle;
            if (savedData.contributedThisCycle !== undefined) updated.contributedThisCycle = savedData.contributedThisCycle;
            if (savedData.nextPayoutRecipient !== undefined) updated.nextPayoutRecipient = savedData.nextPayoutRecipient;
            if (savedData.transactions !== undefined) updated.transactions = savedData.transactions;
            if (savedData.autoSimulate !== undefined) updated.autoSimulate = savedData.autoSimulate;
          } catch (e) {
            console.error("Failed to parse saved circle data", e);
          }
        }

        return updated;
      });
    }
  }, []);

  return (
    <CircleContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        updateBalance,
        setMode,
        setContracts,
        createCircle,
        contribute,
        triggerPayout,
        setAutoSimulate,
        addToast,
        toasts,
      }}
    >
      {children}
    </CircleContext.Provider>
  );
}

export function useCircle() {
  const context = useContext(CircleContext);
  if (!context) {
    throw new Error("useCircle must be used within a CircleProvider");
  }
  return context;
}
