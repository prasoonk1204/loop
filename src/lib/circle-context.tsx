"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { scValToNative, nativeToScVal, Account, TransactionBuilder, Operation, xdr, rpc } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { rpcServer, horizonServer, STELLAR_NETWORK_PASSPHRASE, nativeBalance } from "./stellar";

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
  deleteCircle: () => Promise<void>;
  leaveCircle: () => Promise<void>;
  setAutoSimulate: (simulate: boolean) => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
};

const CircleContext = createContext<CircleContextType | undefined>(undefined);

export function CircleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CircleState>({
    mode: "soroban",
    publicKey: "",
    walletName: "",
    balance: "0",
    poolContractId: process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "",
    registryContractId: process.env.NEXT_PUBLIC_SOROBAN_REGISTRY_CONTRACT_ID || "",
    tokenContractId: process.env.NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID || "",
    members: [],
    contributionAmount: 0,
    cycleLength: 0,
    currentCycle: 0,
    contributedThisCycle: [],
    nextPayoutRecipient: "",
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

  const fetchCircleState = useCallback(async (contractId: string) => {
    if (!contractId || contractId.startsWith("CC...")) return;
    
    try {
      const sourceAddr = state.publicKey || "GCQKBI3RFBB7N73FLCG2IHSX57LF5RN7J4OBONRDBKCHP7P2YG45OZ43";
      const sourceAccount = new Account(sourceAddr, "0");

      const simulateCall = async (method: string, args: any[] = []) => {
        const tx = new TransactionBuilder(sourceAccount, {
          fee: "100",
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        })
          .addOperation(Operation.invokeContractFunction({
            contract: contractId,
            function: method,
            args: args,
          }))
          .setTimeout(30)
          .build();
        const sim = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
          return scValToNative(sim.result.retval);
        }
        return null;
      };

      const rawMembers = await simulateCall("get_members") as string[] | null;
      if (!rawMembers || rawMembers.length === 0) {
        setState((prev) => ({
          ...prev,
          members: [],
          contributionAmount: 0,
          cycleLength: 0,
          currentCycle: 0,
          contributedThisCycle: [],
          nextPayoutRecipient: "",
        }));
        return;
      }
      
      const contributionVal = await simulateCall("get_contribution_amount");
      const contributionAmount = contributionVal !== null ? Number(BigInt(contributionVal) / BigInt(10000000)) : 0;
      
      const lengthVal = await simulateCall("get_cycle_length");
      const cycleLength = lengthVal !== null ? Number(lengthVal) : 0;

      let currentCycle = 0;
      while (true) {
        const paid = await simulateCall("is_cycle_paid", [nativeToScVal(BigInt(currentCycle), { type: "u64" })]);
        if (paid === true) {
          currentCycle++;
        } else {
          break;
        }
      }

      const contributedThisCycle: string[] = [];
      for (const m of rawMembers) {
        const contributed = await simulateCall("is_contributed", [
          nativeToScVal(BigInt(currentCycle), { type: "u64" }),
          nativeToScVal(m, { type: "address" }),
        ]);
        if (contributed === true) {
          contributedThisCycle.push(m);
        }
      }

      const nextPayoutRecipient = rawMembers[currentCycle % rawMembers.length] || "";

      setState((prev) => ({
        ...prev,
        members: rawMembers,
        contributionAmount,
        cycleLength,
        currentCycle,
        contributedThisCycle,
        nextPayoutRecipient,
      }));
    } catch (e) {
      console.error("Error fetching Soroban circle state:", e);
    }
  }, [state.publicKey]);

  const submitSorobanTransaction = useCallback(async (
    contractId: string,
    functionName: string,
    args: any[],
    successMsg: string
  ) => {
    if (!state.publicKey) {
      addToast("Connect wallet first", "error");
      return false;
    }
    
    setState((prev) => ({ ...prev, pendingTx: true }));
    try {
      const account = await rpcServer.getAccount(state.publicKey);
      
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: contractId,
          function: functionName,
          args: args,
        }))
        .setTimeout(180)
        .build();

      addToast("Simulating transaction...", "info");
      const preparedTx = await rpcServer.prepareTransaction(tx);

      addToast("Please sign transaction in your wallet...", "info");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        preparedTx.toXDR(),
        { address: state.publicKey, networkPassphrase: STELLAR_NETWORK_PASSPHRASE }
      );
      
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      
      addToast("Submitting transaction to network...", "info");
      const sendResp = await rpcServer.sendTransaction(signedTx);
      
      if (sendResp.status === "ERROR") {
        throw new Error(`RPC send error: ${JSON.stringify(sendResp.errorResult)}`);
      }
      
      const txHash = sendResp.hash;
      
      addToast("Waiting for transaction confirmation...", "info");
      let statusResp;
      for (let attempt = 0; attempt < 30; attempt++) {
        statusResp = await rpcServer.getTransaction(txHash);
        if (statusResp.status === "SUCCESS") {
          break;
        }
        if (statusResp.status === "FAILED") {
          throw new Error("Transaction execution failed on-chain");
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      
      if (statusResp?.status !== "SUCCESS") {
        throw new Error("Transaction confirmation timeout");
      }

      addToast(successMsg, "success");
      
      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: functionName === "create_circle" ? "create" : (functionName === "contribute" ? "contribute" : "payout"),
        member: state.publicKey,
        amount: state.contributionAmount,
        cycleId: state.currentCycle,
        status: "success",
        timestamp: Date.now(),
        hash: txHash,
      };
      
      setState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));

      await fetchCircleState(state.poolContractId);
      
      const horizonAccount = await horizonServer.loadAccount(state.publicKey);
      const balance = nativeBalance(horizonAccount.balances);
      setState((prev) => ({ ...prev, balance }));
      
      return true;
    } catch (e: any) {
      console.error(e);
      addToast(`Transaction failed: ${e.message || e}`, "error");
      return false;
    } finally {
      setState((prev) => ({ ...prev, pendingTx: false }));
    }
  }, [state.publicKey, state.poolContractId, state.contributionAmount, state.currentCycle, addToast, fetchCircleState]);

  const connect = (address: string, name: string, balance: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stellar-loop-pubkey", address);
      localStorage.setItem("stellar-loop-wallet-name", name);
    }
    setState((prev) => {
      let updatedMembers = [...prev.members];
      if (address && !updatedMembers.includes(address)) {
        updatedMembers.unshift(address);
      }
      updatedMembers = updatedMembers.filter((m) => m.length === 56 && !m.includes("."));

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
    fetchCircleState(state.poolContractId);
  };

  const disconnect = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stellar-loop-pubkey");
      localStorage.removeItem("stellar-loop-wallet-name");
    }
    setState((prev) => ({
      ...prev,
      publicKey: "",
      walletName: "",
      balance: "0",
      members: [],
      nextPayoutRecipient: "",
    }));
    addToast("Disconnected wallet", "info");
  };

  const updateBalance = (balance: string) => {
    setState((prev) => ({ ...prev, balance }));
  };

  const setMode = (mode: "mock" | "soroban") => {
    setState((prev) => ({
      ...prev,
      mode: "soroban",
      poolContractId: process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "",
      registryContractId: process.env.NEXT_PUBLIC_SOROBAN_REGISTRY_CONTRACT_ID || "",
      tokenContractId: process.env.NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID || "",
    }));
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
    // Check if registry already has members registered to prevent WasmVm InvalidAction traps on retries
    let membersAlreadyRegistered = false;
    try {
      const sourceAddr = state.publicKey || "GCQKBI3RFBB7N73FLCG2IHSX57LF5RN7J4OBONRDBKCHP7P2YG45OZ43";
      const sourceAccount = new Account(sourceAddr, "0");
      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
        .addOperation(Operation.invokeContractFunction({
          contract: state.registryContractId,
          function: "get_next_recipient",
          args: [nativeToScVal(BigInt(0), { type: "u64" })],
        }))
        .setTimeout(30)
        .build();
      const sim = await rpcServer.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim)) {
        membersAlreadyRegistered = true;
      }
    } catch (e) {
      console.log("Registry members check simulated:", e);
    }

    if (!membersAlreadyRegistered) {
      const registerArgs = [
        xdr.ScVal.scvVec(members.map(m => nativeToScVal(m, { type: "address" })))
      ];
      const regSuccess = await submitSorobanTransaction(
        state.registryContractId,
        "register_members",
        registerArgs,
        "Members registered in registry contract!"
      );
      if (!regSuccess) return;
    }

    const args = [
      xdr.ScVal.scvVec(members.map(m => nativeToScVal(m, { type: "address" }))),
      nativeToScVal(BigInt(amount) * BigInt(10000000), { type: "i128" }),
      nativeToScVal(BigInt(length), { type: "u64" }),
    ];
    await submitSorobanTransaction(
      state.poolContractId,
      "create_circle",
      args,
      "Savings circle created on-chain!"
    );
  };

  const contribute = async (memberAddress: string) => {
    const args = [
      nativeToScVal(state.publicKey, { type: "address" }),
      nativeToScVal(BigInt(state.currentCycle), { type: "u64" }),
    ];
    await submitSorobanTransaction(
      state.poolContractId,
      "contribute",
      args,
      `Contributed ${state.contributionAmount} XLM!`
    );
  };

  const triggerPayout = useCallback(async () => {
    const args = [
      nativeToScVal(BigInt(state.currentCycle), { type: "u64" }),
    ];
    await submitSorobanTransaction(
      state.poolContractId,
      "payout",
      args,
      `Cycle payout released!`
    );
  }, [state.currentCycle, submitSorobanTransaction]);

  const deleteCircle = async () => {
    const success = await submitSorobanTransaction(
      state.poolContractId,
      "delete_circle",
      [nativeToScVal(state.publicKey, { type: "address" })],
      "Circle deleted successfully!"
    );
    if (success) {
      await submitSorobanTransaction(
        state.registryContractId,
        "reset_registry",
        [nativeToScVal(state.publicKey, { type: "address" })],
        "Registry reset successfully!"
      );
      setState((prev) => ({
        ...prev,
        members: [],
        contributionAmount: 0,
        cycleLength: 0,
        currentCycle: 0,
        contributedThisCycle: [],
        nextPayoutRecipient: "",
      }));
    }
  };

  const leaveCircle = async () => {
    const success = await submitSorobanTransaction(
      state.poolContractId,
      "leave_circle",
      [nativeToScVal(state.publicKey, { type: "address" })],
      "Left circle successfully in pool!"
    );
    if (success) {
      await submitSorobanTransaction(
        state.registryContractId,
        "remove_member",
        [nativeToScVal(state.publicKey, { type: "address" })],
        "Left circle successfully in registry!"
      );
      setState((prev) => {
        const updatedMembers = prev.members.filter((m) => m !== state.publicKey);
        return {
          ...prev,
          members: updatedMembers,
          nextPayoutRecipient: updatedMembers[prev.currentCycle % updatedMembers.length] || "",
        };
      });
    }
  };

  const setAutoSimulate = (simulate: boolean) => {
  };

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
        autoSimulate: false,
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
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDataStr = localStorage.getItem("stellar-loop-circle-data");
      const savedPublicKey = localStorage.getItem("stellar-loop-pubkey");
      const savedWalletName = localStorage.getItem("stellar-loop-wallet-name");

      setState((prev) => {
        const updated = { ...prev };
        updated.mode = "soroban";
        updated.poolContractId = process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "";
        updated.registryContractId = process.env.NEXT_PUBLIC_SOROBAN_REGISTRY_CONTRACT_ID || "";
        updated.tokenContractId = process.env.NEXT_PUBLIC_SOROBAN_TOKEN_CONTRACT_ID || "";

        if (savedDataStr) {
          try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.members !== undefined) {
              updated.members = savedData.members.filter((m: string) => m.length === 56 && !m.includes("."));
            }
            if (savedData.contributionAmount !== undefined) updated.contributionAmount = savedData.contributionAmount;
            if (savedData.cycleLength !== undefined) updated.cycleLength = savedData.cycleLength;
            if (savedData.currentCycle !== undefined) updated.currentCycle = savedData.currentCycle;
            if (savedData.contributedThisCycle !== undefined) updated.contributedThisCycle = savedData.contributedThisCycle;
            if (savedData.nextPayoutRecipient !== undefined) updated.nextPayoutRecipient = savedData.nextPayoutRecipient;
            if (savedData.transactions !== undefined) updated.transactions = savedData.transactions;
          } catch (e) {
            console.error("Failed to parse saved circle data", e);
          }
        }

        return updated;
      });

      if (savedPublicKey && savedWalletName) {
        void (async () => {
          try {
            const account = await horizonServer.loadAccount(savedPublicKey);
            const bal = nativeBalance(account.balances);
            setState((prev) => {
              let updatedMembers = [...prev.members];
              if (savedPublicKey && !updatedMembers.includes(savedPublicKey)) {
                updatedMembers.unshift(savedPublicKey);
              }
              updatedMembers = updatedMembers.filter((m) => m.length === 56 && !m.includes("."));
              return {
                ...prev,
                publicKey: savedPublicKey,
                walletName: savedWalletName,
                balance: bal,
                members: updatedMembers,
                nextPayoutRecipient: updatedMembers[prev.currentCycle % updatedMembers.length] || "",
              };
            });
          } catch (e) {
            console.error("Failed to auto-reconnect wallet", e);
          }
        })();
      }

      const contractId = process.env.NEXT_PUBLIC_SOROBAN_POOL_CONTRACT_ID || "";
      fetchCircleState(contractId);
    }
  }, [fetchCircleState]);

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
        deleteCircle,
        leaveCircle,
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
