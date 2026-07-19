"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Coins,
  Clock,
  ArrowRight,
  HelpCircle,
  Users,
} from "lucide-react";

export function CreateView() {
  const router = useRouter();
  const { createCircle, publicKey, mode, members: activeMembers, addToast } = useCircle();
  const [amount, setAmount] = useState("100");
  const [length, setLength] = useState("10");
  const [newMember, setNewMember] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // Default member list (pre-filled for ease of use)
  const [members, setMembers] = useState<string[]>([]);

  const isCircleActive = !!publicKey && activeMembers && activeMembers.length > 0;

  // Sync members list when mode or connected wallet changes
  React.useEffect(() => {
    if (mode === "soroban") {
      setMembers(publicKey ? [publicKey] : []);
    } else {
      setMembers([
        publicKey || "GB7VKJ...3M6K7",
        "GDFO7R...4R4E2",
        "GATYK9...JK9P1",
        "GCOO4S...XS4X8"
      ]);
    }
  }, [mode, publicKey]);

  // Mark as intentional: initialize members from wallet/mode on mount


  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = newMember.trim();
    if (!addr) { setFormError("Enter a Stellar public key."); return; }

    // Quick validation: must be a string key or starting with G
    if (!addr.startsWith("G") || addr.length < 10) {
      setFormError("Use a valid Stellar public key starting with G.");
      addToast("Invalid Stellar address format", "error");
      return;
    }
    if (members.includes(addr)) {
      setFormError("This member is already in the circle.");
      addToast("Member already added", "error");
      return;
    }

    setMembers([...members, addr]);
    setFormError("");
    setNewMember("");
    addToast("Member added to list", "success");
  };

  const handleRemoveMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
    addToast("Member removed", "info");
  };

  const handleCreate = async () => {
    setFormError("");
    if (isCircleActive) {
      setFormError("Leave your current circle before creating a new one.");
      return;
    }
    if (members.length < 2) {
      setFormError("Add at least 2 members to create a circle.");
      addToast("Savings circle must have at least 2 members", "error");
      return;
    }
    const parsedAmount = parseFloat(amount);
    const parsedLength = parseInt(length);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Contribution amount must be greater than 0.");
      return;
    }
    if (isNaN(parsedLength) || parsedLength <= 0) {
      setFormError("Cycle length must be greater than 0.");
      return;
    }

    setCreating(true);
    const success = await createCircle(members, parsedAmount, parsedLength);
    setCreating(false);
    if (success) router.push("/dashboard");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Already-in-circle notice */}
      {isCircleActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="md:col-span-2 flex items-start md:flex-row flex-col gap-3 px-5 py-4"
          style={{
            background: "oklch(78% 0.15 85 / 0.07)",
            border: "1px solid oklch(78% 0.15 85 / 0.3)",
            borderRadius: "4px",
          }}
        >
          <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(78% 0.15 85)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "oklch(78% 0.15 85)" }}>
              You are already in an active circle
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(65% 0.008 85)" }}>
              Only one circle can be active at a time. Leave or delete your current circle from the dashboard before creating a new one.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn btn-primary py-2 px-4 text-xs shrink-0"
          >
            Go to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}
      {formError && <div className="md:col-span-2 px-4 py-3 text-xs" role="alert" style={{ color: "oklch(70% 0.14 20)" }}>{formError}</div>}
      {creating && <div className="md:col-span-2 px-4 py-3 text-xs" role="status" style={{ color: "oklch(78% 0.15 85)" }}>Creating circle on-chain. Confirm wallet requests…</div>}
      {/* Parameters panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ background: "oklch(13% 0.008 85)", border: "1px solid oklch(20% 0.006 85)", borderRadius: "4px" }}
      >
        <div className="px-6 py-5" style={{ borderBottom: "1px solid oklch(20% 0.006 85)" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "oklch(45% 0.005 85)" }}>
            Configure savings circle
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "oklch(45% 0.005 85)" }}>
              <Coins className="w-3.5 h-3.5" style={{ color: "oklch(78% 0.15 85)" }} />
              Contribution amount (XLM)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="100"
              min="1"
            />
            <p className="text-[11px]" style={{ color: "oklch(45% 0.005 85)" }}>Amount each member contributes per cycle.</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "oklch(45% 0.005 85)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "oklch(78% 0.15 85)" }} />
              Cycle length (ledgers)
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="input-field"
              placeholder="10"
              min="1"
            />
            <p className="text-[11px]" style={{ color: "oklch(45% 0.005 85)" }}>Duration in ledger closures of each round.</p>
          </div>
        </div>

        <div
          className="mx-6 mb-6 p-4 flex gap-3 text-xs leading-relaxed"
          style={{
            background: "oklch(78% 0.15 85 / 0.06)",
            border: "1px solid oklch(78% 0.15 85 / 0.18)",
            borderRadius: "2px",
            color: "oklch(68% 0.008 85)",
          }}
        >
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "oklch(78% 0.15 85)" }} />
          <div>
            <span className="font-semibold block mb-0.5" style={{ color: "oklch(78% 0.15 85)" }}>How ROSCAs work</span>
            Each cycle, all members contribute. One member receives the full pool. The rotation follows the member list order.
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleCreate}
            disabled={!!isCircleActive || creating}
            className="btn btn-primary w-full py-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? "Creating…" : "Create Circle"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Members builder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
        style={{ background: "oklch(13% 0.008 85)", border: "1px solid oklch(20% 0.006 85)", borderRadius: "4px" }}
      >
        <div className="px-6 py-5" style={{ borderBottom: "1px solid oklch(20% 0.006 85)" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "oklch(45% 0.005 85)" }}>
            Members ({members.length})
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Add member form */}
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input
              type="text"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="input-field flex-1"
              placeholder="Stellar public key (G…)"
              aria-invalid={!!formError}
            />
            <button
              type="submit"
              data-testid="add-member-btn"
              className="btn btn-secondary px-4 cursor-pointer"
              style={{ minWidth: "44px" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Member list */}
          <div className="max-h-80 overflow-y-auto" style={{ borderTop: "1px solid oklch(20% 0.006 85)" }}>
            <AnimatePresence>
              {members.map((member, index) => {
                const isUser = member === publicKey;
                return (
                  <motion.div
                    key={member}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom: "1px solid oklch(20% 0.006 85)",
                        background: isUser ? "oklch(78% 0.15 85 / 0.04)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-6 h-6 shrink-0 flex items-center justify-center text-[11px] font-semibold"
                          style={{
                            background: "oklch(17% 0.008 85)",
                            border: "1px solid oklch(25% 0.007 85)",
                            color: "oklch(55% 0.007 85)",
                            borderRadius: "2px",
                          }}
                        >
                          {index + 1}
                        </div>
                        <span
                          className="text-xs truncate max-w-[200px] block"
                          style={{ color: isUser ? "oklch(78% 0.15 85)" : "oklch(80% 0.008 85)" }}
                          title={member}
                        >
                          {member}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(index)}
                        className="p-1.5 transition-colors cursor-pointer shrink-0"
                        style={{ color: "oklch(45% 0.005 85)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
