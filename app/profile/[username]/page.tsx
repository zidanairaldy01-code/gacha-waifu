/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, sendGift, getMe } from "@/lib/api";

interface ShowcaseWaifu {
  id: number;
  name: string;
  rarity: string;
  image_url: string;
  affection_level: number;
}

interface ProfileData {
  id: number;
  name: string;
  username: string;
  total_collection: number;
  total_ssr: number;
  total_affection: number;
  showcase_waifus: ShowcaseWaifu[];
}

const rarityBorder: Record<string, string> = {
  SSR: "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]",
  SR:  "border-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.4)]",
  R:   "border-blue-400",
};

const rarityBadge: Record<string, string> = {
  SSR: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
  SR:  "bg-gradient-to-r from-purple-400 to-violet-600 text-white",
  R:   "bg-gradient-to-r from-blue-400 to-sky-600 text-white",
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Gift modal
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [giftError, setGiftError] = useState("");

  // Current user (untuk cek apakah ini profil sendiri)
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!username) return;
    getProfile(username).then((data) => {
      if (data.success) {
        setProfile(data.data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }).catch(() => { setNotFound(true); setLoading(false); });

    // Cek apakah user login
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      setIsLoggedIn(true);
      getMe().then((me) => { if (me?.username) setMyUsername(me.username); }).catch(() => {});
    }
  }, [username]);

  const handleSendGift = async () => {
    if (!giftAmount || giftAmount < 1) return;
    setGiftLoading(true);
    setGiftError("");
    setGiftMessage("");
    const data = await sendGift(username, giftAmount);
    if (data.success) {
      setGiftMessage(data.message);
      // Refresh gems di navbar
      window.dispatchEvent(new Event("userUpdated"));
      setTimeout(() => { setShowGiftModal(false); setGiftMessage(""); }, 2000);
    } else {
      setGiftError(data.error || "Gagal mengirim gems.");
    }
    setGiftLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">👤</div>
        <h1 className="text-2xl font-bold">Profil tidak ditemukan</h1>
        <p className="text-gray-400">User <span className="text-pink-400">@{username}</span> tidak ada.</p>
        <Link href="/" className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-semibold transition-all">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const isOwnProfile = myUsername === username;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-pink-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[150px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">

        {/* ── Header Profil ─────────────────────────────────── */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl font-bold border-4 border-white/10 flex-shrink-0 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-white">{profile.name}</h1>
              <p className="text-gray-400 text-sm mt-1">@{profile.username}</p>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{profile.total_collection}</p>
                  <p className="text-xs text-gray-400">Koleksi</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/40 to-amber-900/20 border border-yellow-500/30 rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{profile.total_ssr}</p>
                  <p className="text-xs text-gray-400">SSR</p>
                </div>
                <div className="bg-gradient-to-br from-pink-900/40 to-rose-900/20 border border-pink-500/30 rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-pink-400">{profile.total_affection}</p>
                  <p className="text-xs text-gray-400">Total Affection</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <Link
                  href="/inventory"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-semibold transition-all text-center"
                >
                  ✏️ Edit Showcase
                </Link>
              ) : isLoggedIn ? (
                <button
                  onClick={() => setShowGiftModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border border-yellow-500/30 text-yellow-300 text-sm font-semibold transition-all"
                >
                  💎 Kirim Gems
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-semibold transition-all text-center"
                >
                  Login untuk berinteraksi
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Showcase ──────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>⭐</span> Showcase Koleksi
            {isOwnProfile && (
              <Link href="/inventory" className="ml-2 text-xs text-pink-400 hover:text-pink-300 font-normal border border-pink-500/30 px-2 py-0.5 rounded-full">
                Edit
              </Link>
            )}
          </h2>

          {profile.showcase_waifus.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-5xl mb-3">🎴</p>
              <p className="text-gray-400 text-sm">
                {isOwnProfile ? "Kamu belum memilih showcase. Pergi ke Koleksi untuk memilih hingga 6 waifu!" : "User ini belum memilih showcase."}
              </p>
              {isOwnProfile && (
                <Link href="/inventory" className="mt-4 inline-block px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold hover:scale-105 transition-transform">
                  Pilih Showcase →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {profile.showcase_waifus.map((w) => (
                <div key={w.id} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 ${rarityBorder[w.rarity] || "border-white/10"} group`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                  <img
                    src={w.image_url}
                    alt={w.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${rarityBadge[w.rarity]}`}>
                    {w.rarity}
                  </div>
                  <div className="absolute bottom-0 w-full p-2">
                    <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">{w.name}</p>
                    <p className="text-pink-400 text-[10px]">❤️ {w.affection_level}</p>
                  </div>
                </div>
              ))}
              {/* Slot kosong */}
              {Array.from({ length: Math.max(0, 6 - profile.showcase_waifus.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-gray-600 text-xl">+</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* ── Gift Modal ────────────────────────────────────── */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setShowGiftModal(false); setGiftError(""); setGiftMessage(""); }} />
          <div className="relative w-full max-w-sm bg-[#0d0d14] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full" />

            <div className="text-center">
              <div className="text-4xl mb-2">💎</div>
              <h2 className="text-xl font-bold">Kirim Gems ke <span className="text-yellow-400">@{username}</span></h2>
              <p className="text-gray-500 text-xs mt-1">Maks. 50 gems/hari total</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Jumlah Gems</label>
              <input
                type="number"
                min={1}
                max={50}
                value={giftAmount}
                onChange={(e) => setGiftAmount(Math.min(50, Math.max(1, Number(e.target.value))))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold text-center focus:outline-none focus:border-yellow-500/50"
              />
              {/* Quick select */}
              <div className="flex gap-2 justify-center">
                {[10, 20, 50].map((v) => (
                  <button
                    key={v}
                    onClick={() => setGiftAmount(v)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${giftAmount === v ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {giftError && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{giftError}</p>}
            {giftMessage && <p className="text-green-400 text-xs text-center bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{giftMessage}</p>}

            <button
              onClick={handleSendGift}
              disabled={giftLoading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {giftLoading ? "Mengirim..." : `Kirim ${giftAmount} 💎 Gems`}
            </button>

            <button onClick={() => { setShowGiftModal(false); setGiftError(""); setGiftMessage(""); }} className="text-xs text-gray-500 hover:text-gray-300 text-center transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
