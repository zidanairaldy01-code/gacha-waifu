/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInventory, updateShowcase, getMe } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface WaifuItem {
  id: number;
  name: string;
  rarity: string;
  description: string;
  image_url: string;
  pivot: {
    affection_level: number;
    level: number;
    chat_token: string;
  };
}

const rarityBorder: Record<string, string> = {
  SSR: "border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.2)]",
  SR: "border-purple-500/60 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
  R: "border-blue-500/40",
};

const rarityBadge: Record<string, string> = {
  SSR: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
  SR: "bg-gradient-to-r from-purple-400 to-violet-600 text-white",
  R: "bg-gradient-to-r from-blue-400 to-sky-600 text-white",
};

export default function InventoryPage() {
  const router = useRouter();
  const [waifus, setWaifus] = useState<WaifuItem[]>([]);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedWaifu, setSelectedWaifu] = useState<WaifuItem | null>(null);
  const [showcaseIds, setShowcaseIds] = useState<number[]>([]);
  const [showcaseSaving, setShowcaseSaving] = useState(false);
  const [showcaseMsg, setShowcaseMsg] = useState("");

  const handleChatClick = (waifu: WaifuItem) => {
    setSelectedWaifu(waifu);
    setTimeout(() => {
      router.push(`/chat/${waifu.pivot.chat_token}`);
    }, 700);
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/login"); return; }

    // Load showcase dari profil user
    getMe().then((me) => {
      if (me?.showcase_waifu_ids) setShowcaseIds(me.showcase_waifu_ids);
    }).catch(() => {});

    getInventory().then((data) => {
      if (Array.isArray(data)) setWaifus(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const toggleShowcase = async (waifuId: number) => {
    let newIds: number[];
    if (showcaseIds.includes(waifuId)) {
      newIds = showcaseIds.filter((id) => id !== waifuId);
    } else {
      if (showcaseIds.length >= 6) {
        setShowcaseMsg("Maksimal 6 waifu di showcase!");
        setTimeout(() => setShowcaseMsg(""), 3000);
        return;
      }
      newIds = [...showcaseIds, waifuId];
    }
    setShowcaseIds(newIds);
    setShowcaseSaving(true);
    const data = await updateShowcase(newIds);
    setShowcaseSaving(false);
    if (data.success) {
      setShowcaseMsg(newIds.includes(waifuId) ? "Ditambahkan ke showcase!" : "Dihapus dari showcase.");
    } else {
      setShowcaseMsg("Gagal update showcase.");
    }
    setTimeout(() => setShowcaseMsg(""), 2500);
  };

  const filtered = waifus.filter((w) => {
    const matchRarity = filter === "Semua" || w.rarity === filter;
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
    return matchRarity && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative font-sans">
      {/* Zoom-in overlay when clicking Chat */}
      <AnimatePresence>
        {selectedWaifu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-48 h-48 rounded-full overflow-hidden border-4 shadow-2xl ${
                selectedWaifu.pivot.affection_level >= 50
                  ? "border-yellow-300 shadow-yellow-400/60"
                  : "border-pink-500 shadow-pink-500/40"
              }`}>
                <img
                  src={selectedWaifu.image_url}
                  alt={selectedWaifu.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white text-xl font-bold tracking-wide"
              >
                💬 Menghubungi {selectedWaifu.name}...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-900/20 blur-[150px] pointer-events-none" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8 relative z-10 flex flex-col">
        {/* Filter & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            {["Semua", "SSR", "SR", "R"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filter === f
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Cari waifu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm w-48 md:w-64 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        {/* Showcase Info Bar */}
        <div className="flex items-center justify-between mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400">⭐</span>
            <span className="text-gray-300">Showcase: <span className="text-white font-bold">{showcaseIds.length}/6</span></span>
            {showcaseSaving && <span className="text-xs text-gray-500 animate-pulse">Menyimpan...</span>}
            {showcaseMsg && <span className="text-xs text-pink-400">{showcaseMsg}</span>}
          </div>
          <span className="text-xs text-gray-500">Klik ⭐ di kartu untuk tambah/hapus showcase</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin" />
            <span>Memuat koleksi...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-6xl">🎴</div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-300 mb-2">
                {search || filter !== "Semua" ? "Waifu tidak ditemukan" : "Koleksi Kosong"}
              </h2>
              <p className="text-gray-500 text-sm">
                {search || filter !== "Semua" ? "Coba cari dengan nama lain." : "Pergi ke halaman Gacha dan mulai menarik!"}
              </p>
            </div>
            {!search && filter === "Semua" && (
              <Link href="/gacha" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform">
                Gacha Sekarang →
              </Link>
            )}
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {filtered.map((waifu) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 }
                }}
                key={waifu.id}
                className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 ${waifu.pivot.affection_level >= 50 ? "border-yellow-300 shadow-[0_0_30px_rgba(253,224,71,0.6)]" : rarityBorder[waifu.rarity] || "border-white/10"} transition-transform hover:-translate-y-2`}
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black" />

                {/* Rarity Badge */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold z-10 ${rarityBadge[waifu.rarity]}`}>
                  {waifu.rarity}
                </div>

                {/* Affection */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-pink-400 z-10">
                  ❤️ {waifu.pivot.affection_level}
                </div>

                {/* Showcase badge */}
                {showcaseIds.includes(waifu.id) && (
                  <div className="absolute top-8 right-2 bg-yellow-500/80 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                    ⭐
                  </div>
                )}

                {/* Character Image */}
                <div className="absolute inset-0 flex items-center justify-center pt-4">
                  <img
                    src={waifu.image_url}
                    alt={waifu.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      // Fallback jika gambar belum ada
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Placeholder fallback */}
                  <div className="hidden w-20 h-20 rounded-full bg-white/5 border border-white/10" />
                </div>

                {/* Info */}
                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent group-hover:pb-2 transition-all">
                  <h3 className="font-bold text-lg leading-tight">{waifu.name}</h3>
                  <p className="text-pink-400 text-xs font-semibold">Lv. {waifu.pivot.level}</p>
                  <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                      href={`/chat/${waifu.pivot.chat_token}`}
                      onClick={(e) => { e.preventDefault(); handleChatClick(waifu); }}
                      className="flex-1 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-center text-xs font-bold block"
                    >
                      💬 Chat
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShowcase(waifu.id); }}
                      className={`w-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                        showcaseIds.includes(waifu.id)
                          ? "bg-yellow-500/30 border border-yellow-500/60 text-yellow-400"
                          : "bg-white/10 border border-white/10 text-gray-400 hover:text-yellow-400"
                      }`}
                      title={showcaseIds.includes(waifu.id) ? "Hapus dari Showcase" : "Tambah ke Showcase"}
                    >
                      ⭐
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
