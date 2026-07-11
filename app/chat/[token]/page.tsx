/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { sendChat, getChatHistory, getMe, resolveChatToken } from "@/lib/api";
import { playChatSendSound, playChatReceiveSound } from "@/lib/audio";

interface Message {
  role: string;
  content: string;
}

interface WaifuData {
  id: number;
  name: string;
  rarity: string;
  description: string;
  image_url?: string;
}

const rarityColor: Record<string, string> = {
  SSR: "text-yellow-400",
  SR: "text-purple-400",
  R: "text-blue-400",
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [energy, setEnergy] = useState<number | null>(null);
  const [waifu, setWaifu] = useState<WaifuData | null>(null);
  const [affection, setAffection] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) { router.push("/login"); return; }

    // Resolve token → dapatkan data waifu + validasi kepemilikan
    resolveChatToken(token).then((data) => {
      if (!data.success) {
        setAccessDenied(true);
        setHistoryLoading(false);
        return;
      }
      setWaifu(data.waifu);
      setAffection(data.affection_level ?? 0);
    }).catch(() => {
      setAccessDenied(true);
      setHistoryLoading(false);
    });

    // Load user energy
    getMe().then((data) => {
      if (data.id) setEnergy(data.energy);
    });

    // Load riwayat chat
    getChatHistory(token).then((data) => {
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
      setHistoryLoading(false);
    }).catch(() => setHistoryLoading(false));
  }, [token, router]);

  // Auto scroll ke bawah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setError("");
    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    const sentMessage = message;
    setMessage("");
    setLoading(true);
    playChatSendSound();

    try {
      const data = await sendChat(token, sentMessage);
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        setEnergy(data.remaining_energy);
        playChatReceiveSound();
      } else {
        setError(data.error || "Gagal mendapatkan respons.");
        setMessages((prev) => prev.slice(0, -1));
        setMessage(sentMessage);
      }
    } catch {
      setError("Tidak bisa terhubung ke server backend.");
      setMessages((prev) => prev.slice(0, -1));
      setMessage(sentMessage);
    } finally {
      setLoading(false);
    }
  };

  // ── Akses ditolak ──────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white gap-6">
        <div className="text-6xl">🔒</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-gray-400 text-sm">
            Kamu belum memiliki karakter ini atau link tidak valid.
          </p>
        </div>
        <Link
          href="/inventory"
          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold transition-all"
        >
          Kembali ke Koleksi
        </Link>
      </div>
    );
  }

  const waifuName = waifu?.name ?? "...";
  const waifuRarity = waifu?.rarity ?? "R";
  const rarityClass = rarityColor[waifuRarity] ?? "text-gray-400";

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/inventory" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold border-2 border-white/10 overflow-hidden relative">
                {waifu?.image_url ? (
                  <img src={waifu.image_url} alt={waifuName} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">{waifuName.charAt(0)}</div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full" />
            </div>
            <div>
              <h1 className="font-bold text-white flex items-center gap-2">
                {waifuName}
                {affection >= 50 && <span title="Max Bond" className="text-yellow-400 text-xs">✨</span>}
              </h1>
              <p className={`text-xs font-semibold flex items-center gap-2 ${rarityClass}`}>
                <span>{waifuRarity} • AI Online</span>
                <span className="text-gray-500">|</span>
                <span className="text-pink-400">❤️ {affection}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-sm">
          <span className="text-blue-400 font-bold">⚡ {energy ?? "..."}</span>
          <span className="text-gray-400 text-xs">Energi</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Loading riwayat */}
        {historyLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!historyLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 max-w-xs">
              <div className="text-5xl mb-4">💌</div>
              <p className="font-semibold text-gray-400 mb-1">Mulai percakapan dengan {waifuName}!</p>
              <p className="text-sm">Kirim pesan pertamamu dan biarkan AI bereaksi sesuai kepribadiannya.</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 overflow-hidden border border-white/10">
                {waifu?.image_url ? (
                  <img src={waifu.image_url} alt={waifuName} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">{waifuName.charAt(0)}</div>
                )}
              </div>
            )}
            <div
              className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-pink-600 to-purple-600 rounded-tr-none text-white shadow-[0_4px_15px_rgba(236,72,153,0.25)]"
                  : "bg-white/10 rounded-tl-none border border-white/10 text-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 overflow-hidden border border-white/10">
              {waifu?.image_url ? (
                <img src={waifu.image_url} alt={waifuName} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">{waifuName.charAt(0)}</div>
              )}
            </div>
            <div className="bg-white/10 rounded-2xl rounded-tl-none border border-white/10 px-5 py-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Error Banner */}
      {error && (
        <div className="px-6 pb-2 flex-shrink-0">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <footer className="p-4 flex-shrink-0 bg-black/30 backdrop-blur-md border-t border-white/5">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center">
          <input
            type="text"
            id="chat-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              energy === 0
                ? "Energi habis! Tunggu isi ulang..."
                : `Pesan ke ${waifuName}... (−1 ⚡)`
            }
            disabled={loading || energy === 0}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            id="chat-send-btn"
            disabled={!message.trim() || loading || energy === 0}
            className="absolute right-1.5 p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
