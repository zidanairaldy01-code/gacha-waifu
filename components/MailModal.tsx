"use client";

import { useState, useEffect } from "react";
import { getMails, claimMail } from "@/lib/api";
import { playClaimSound } from "@/lib/audio";
import ClaimParticles from "./ClaimParticles";

interface Mail {
  id: number;
  title: string;
  message: string;
  reward_gems: number;
  is_read: boolean;
  is_claimed: boolean;
  created_at: string;
}

export default function MailModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getMails().then((res) => {
        if (res.success) {
          setMails(res.data);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = async (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (claimingId) return;

    // This is a hacky way to render particles dynamically without strict React roots in this context
    playClaimSound();
    
    setClaimingId(id);
    const res = await claimMail(id);
    setClaimingId(null);
    
    if (res.success) {
      setMails(mails.map(m => m.id === id ? { ...m, is_read: true, is_claimed: true } : m));
      window.dispatchEvent(new Event("userUpdated")); // Sync gems di navbar
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>✉️</span> Kotak Surat
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : mails.length === 0 ? (
            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
              <span className="text-4xl mb-3 opacity-50">📭</span>
              <p>Kotak surat kosong.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mails.map((mail) => (
                <div 
                  key={mail.id} 
                  className={`p-5 rounded-xl border ${mail.is_claimed ? 'bg-black/40 border-white/5 opacity-70' : 'bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-bold text-lg ${mail.is_claimed ? 'text-gray-300' : 'text-blue-400'}`}>
                      {mail.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(mail.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 text-sm whitespace-pre-wrap mb-4">
                    {mail.message}
                  </div>
                  
                  {mail.reward_gems > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Lampiran:</span>
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
                          <span>💎</span>
                          <span className="text-yellow-400 font-bold text-sm">{mail.reward_gems.toLocaleString()} Gems</span>
                        </div>
                      </div>
                      
                      {!mail.is_claimed ? (
                        <button
                          onClick={(e) => handleClaim(mail.id, e)}
                          disabled={claimingId === mail.id}
                          className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-6 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                        >
                          {claimingId === mail.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Klaim"
                          )}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm font-semibold px-4 py-1.5 border border-white/5 rounded-full bg-white/5">
                          Terklaim ✓
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
