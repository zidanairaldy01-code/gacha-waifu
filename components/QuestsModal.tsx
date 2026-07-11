"use client";

import { useEffect, useState } from "react";
import { getQuests, claimQuest } from "@/lib/api";
import { playClaimSound } from "@/lib/audio";
import ClaimParticles from "./ClaimParticles";

type Quest = {
  id: string;
  title: string;
  progress: number;
  target: number;
  is_claimed: boolean;
  reward_text: string;
};

export default function QuestsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimTrigger, setClaimTrigger] = useState(0);
  const [claimType, setClaimType] = useState<"gems" | "ticket">("gems");

  const fetchQuests = async () => {
    const data = await getQuests();
    if (data.success) setQuests(data.quests);
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuests();
    }
  }, [isOpen]);

  const handleClaim = async (questId: string) => {
    setLoading(true);
    const data = await claimQuest(questId);
    if (data.success) {
      playClaimSound();
      setClaimType(questId === "chat" ? "ticket" : "gems");
      setClaimTrigger((t) => t + 1);
      await fetchQuests();
      window.dispatchEvent(new Event("userUpdated"));
    } else {
      alert(data.error || "Gagal mengklaim misi");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <ClaimParticles trigger={claimTrigger} type={claimType} />
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <span>📜</span> Misi Harian
        </h2>

        <div className="space-y-4">
          {quests.map((quest) => {
            const isCompleted = quest.progress >= quest.target;
            return (
              <div key={quest.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{quest.title}</h3>
                    <p className="text-sm text-yellow-400">Hadiah: {quest.reward_text}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-400 bg-black/30 px-2 py-1 rounded">
                    {quest.progress} / {quest.target}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-pink-500'}`}
                    style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                  />
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => handleClaim(quest.id)}
                  disabled={!isCompleted || quest.is_claimed || loading}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                    quest.is_claimed
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : isCompleted
                      ? "bg-gradient-to-r from-yellow-400 to-amber-600 text-black hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-white/10 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {quest.is_claimed ? "Selesai" : isCompleted ? (loading ? "Mengklaim..." : "Klaim Hadiah") : "Belum Selesai"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
