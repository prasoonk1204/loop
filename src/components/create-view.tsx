"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCircle } from "@/lib/circle-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Coins, 
  Clock, 
  ArrowRight,
  HelpCircle
} from "lucide-react";

export function CreateView() {
  const router = useRouter();
  const { createCircle, publicKey, addToast } = useCircle();
  const [amount, setAmount] = useState("100");
  const [length, setLength] = useState("10");
  const [newMember, setNewMember] = useState("");
  
  // Default member list (pre-filled for ease of use)
  const [members, setMembers] = useState<string[]>([
    publicKey || "GB7VKJ...3M6K7",
    "GDFO7R...4R4E2",
    "GATYK9...JK9P1",
    "GCOO4S...XS4X8"
  ]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = newMember.trim();
    if (!addr) return;
    
    // Quick validation: must be a string key or starting with G
    if (!addr.startsWith("G") || addr.length < 10) {
      addToast("Invalid Stellar address format", "error");
      return;
    }
    if (members.includes(addr)) {
      addToast("Member already added", "error");
      return;
    }

    setMembers([...members, addr]);
    setNewMember("");
    addToast("Member added to list", "success");
  };

  const handleRemoveMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
    addToast("Member removed", "info");
  };

  const handleCreate = async () => {
    if (members.length < 2) {
      addToast("Savings circle must have at least 2 members", "error");
      return;
    }
    const parsedAmount = parseFloat(amount);
    const parsedLength = parseInt(length);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast("Contribution amount must be positive", "error");
      return;
    }
    if (isNaN(parsedLength) || parsedLength <= 0) {
      addToast("Cycle length must be positive", "error");
      return;
    }

    await createCircle(members, parsedAmount, parsedLength);
    router.push("/dashboard");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Parameters panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-6 space-y-6"
      >
        <h2 className="text-lg font-bold tracking-tight text-text-main flex items-center gap-2 border-b border-panel-border/40 pb-3">
          Configure Savings Circle
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold tracking-widest text-text-muted flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-brand-primary" />
              Contribution Amount (XLM)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="100"
              min="1"
            />
            <p className="text-[11px] text-text-subtle font-medium">Amount each member contributes in every rotation cycle.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold tracking-widest text-text-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-primary" />
              Cycle Length (Ledgers)
            </label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="input-field"
              placeholder="10"
              min="1"
            />
            <p className="text-[11px] text-text-subtle font-medium">Duration in ledger closures of each savings round.</p>
          </div>
        </div>

        <div className="p-4 bg-bg-base/35 rounded-xl border border-panel-border/60 text-xs text-text-muted flex gap-3 leading-relaxed">
          <HelpCircle className="w-5 h-5 text-brand-primary shrink-0" />
          <div>
            <span className="font-bold text-brand-primary block mb-0.5">Rotating savings circle?</span>
            In a rotating circle, members take turns receiving the pooled savings. In each cycle, every member contributes the amount set above, and one member gets the entire payout. The rotation follows the exact order of the members list.
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary w-full py-3 text-sm cursor-pointer"
        >
          <span>Create Circle</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Members builder */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel p-6 space-y-6"
      >
        <h2 className="text-lg font-bold tracking-tight text-text-main flex items-center gap-2 border-b border-panel-border/40 pb-3">
          Circle Members List ({members.length})
        </h2>

        {/* Add member form */}
        <form onSubmit={handleAddMember} className="flex gap-2">
          <input
            type="text"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            className="input-field flex-1"
            placeholder="Stellar public key (G...)"
          />
          <button type="submit" className="btn btn-secondary p-3 cursor-pointer">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* Member cards */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence>
            {members.map((member, index) => {
              const isUser = member === publicKey;
              return (
                <motion.div
                  key={member}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isUser 
                      ? "bg-[#241f3d]/30 border-brand-primary/25 hover:border-brand-primary/45" 
                      : "bg-bg-base/40 border-panel-border hover:border-panel-border-hover"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-bg-base border border-panel-border/70 text-text-muted flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-text-main truncate max-w-[200px] sm:max-w-xs block" title={member}>
                      {member}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(index)}
                    className="p-2 text-text-subtle hover:text-state-error hover:bg-[#2d1818]/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
