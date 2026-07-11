/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { pullGacha, pullGachaTen, getMe, getBanners } from "@/lib/api";
import { playGachaSound, playSSRWinSound } from "@/lib/audio";

interface WaifuResult {
  id: number;
  name: string;
  rarity: string;
  description: string;
  image_url: string;
}

interface PullResult {
  success: boolean;
  waifu?: WaifuResult;
  results?: Array<{ waifu: WaifuResult; is_pity: boolean; is_duplicate: boolean; chat_token: string }>;
  is_pity?: boolean;
  is_duplicate?: boolean;
  remaining_gems: number;
  remaining_tickets: number;
  pulls_until_pity: number;
  error?: string;
  isTen?: boolean; // client-side flag
}

interface BannerWaifu {
  id: number;
  name: string;
  rarity: string;
  description: string;
  image_url: string;
}

interface Banner {
  id: number;
  name: string;
  description: string;
  theme_color: string;
  waifus: BannerWaifu[];
}

const rarityConfig: Record<string, { gradient: string; glow: string; label: string; border: string }> = {
  SSR: {
    gradient: "from-yellow-400 via-amber-500 to-yellow-600",
    glow: "shadow-[0_0_50px_rgba(234,179,8,0.6)]",
    border: "border-yellow-400",
    label: "✨ SSR",
  },
  SR: {
    gradient: "from-purple-400 via-violet-500 to-purple-600",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.5)]",
    border: "border-purple-400",
    label: "💜 SR",
  },
  R: {
    gradient: "from-blue-400 via-sky-500 to-blue-600",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.4)]",
    border: "border-blue-400",
    label: "💙 R",
  },
};

const bannerThemes: Record<string, {
  bg: string;
  orbColor1: string;
  orbColor2: string;
  accent: string;
  titleColor: string;
  badgeGradient: string;
  glowColor: string;
}> = {
  blue: {
    bg: "linear-gradient(135deg, rgba(30,58,138,0.7) 0%, rgba(88,28,135,0.4) 50%, rgba(55,48,163,0.6) 100%)",
    orbColor1: "rgba(37,99,235,0.22)",
    orbColor2: "rgba(126,34,206,0.22)",
    accent: "#60a5fa",
    titleColor: "#ffffff",
    badgeGradient: "linear-gradient(to right, #eab308, #d97706)",
    glowColor: "rgba(99,102,241,0.35)",
  },
  green: {
    bg: "linear-gradient(135deg, rgba(6,78,59,0.7) 0%, rgba(15,118,110,0.4) 50%, rgba(20,83,45,0.6) 100%)",
    orbColor1: "rgba(16,185,129,0.22)",
    orbColor2: "rgba(20,184,166,0.22)",
    accent: "#34d399",
    titleColor: "#ecfdf5",
    badgeGradient: "linear-gradient(to right, #10b981, #0d9488)",
    glowColor: "rgba(16,185,129,0.35)",
  },
};

/** Smooth color transition hook – lerps between two hex/rgba orb colors */
function useSmoothColor(targetColor: string, duration = 700) {
  const [current, setCurrent] = useState(targetColor);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(targetColor);
  const toRef = useRef(targetColor);

  useEffect(() => {
    if (targetColor === toRef.current) return;
    fromRef.current = current;
    toRef.current = targetColor;
    startRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // Ease in-out cubic
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      // We can't truly lerp complex CSS strings, so we just crossfade using opacity trick
      // For actual color lerp we'd need to parse rgba. Instead we jump with opacity animation.
      if (progress >= 1) {
        setCurrent(toRef.current);
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetColor, duration]);

  return current;
}

export default function GachaPage() {
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState("");
  const [gems, setGems] = useState<number | null>(null);
  const [tickets, setTickets] = useState<number>(0);
  const [pullsUntilPity, setPullsUntilPity] = useState<number>(50);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerId, setActiveBannerId] = useState<number>(1);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeBanner = banners.find((b) => b.id === activeBannerId) ?? banners[0];
  const theme = bannerThemes[activeBanner?.theme_color ?? "blue"] ?? bannerThemes.blue;

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { window.location.href = "/login"; return; }

    getMe().then((data) => {
      if (data && typeof data.gems === "number") {
        setGems(data.gems);
        setTickets(data.tickets ?? 0);
        if (data.pulls_until_pity !== undefined) setPullsUntilPity(data.pulls_until_pity);
      }
    }).catch(() => {});

    getBanners().then((res) => {
      if (res.success && res.data.length > 0) {
        setBanners(res.data);
        setActiveBannerId(res.data[0].id);
      }
    }).catch(() => {});

    const onUpdate = () => getMe().then((data) => {
      if (data?.id) {
        setGems(data.gems);
        setTickets(data.tickets || 0);
        if (data.pulls_until_pity !== undefined) setPullsUntilPity(data.pulls_until_pity);
      }
    }).catch(() => {});
    window.addEventListener("userUpdated", onUpdate);
    return () => window.removeEventListener("userUpdated", onUpdate);
  }, []);

  /** Smooth banner switch: fade out → swap → fade in */
  const switchBanner = useCallback((newId: number) => {
    if (newId === activeBannerId || isTransitioning) return;
    setIsTransitioning(true);
    setBannerVisible(false);
    setResult(null);
    setShowResult(false);
    setError("");

    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    transitionTimeout.current = setTimeout(() => {
      setActiveBannerId(newId);
      setBannerVisible(true);
      setTimeout(() => setIsTransitioning(false), 500);
    }, 350); // wait for fade-out to finish
  }, [activeBannerId, isTransitioning]);

  useEffect(() => () => { if (transitionTimeout.current) clearTimeout(transitionTimeout.current); }, []);

  const handlePull = async () => {
    if (pulling) return;
    setError("");
    setPulling(true);
    setShowResult(false);
    setResult(null);
    playGachaSound();

    try {
      const data = await pullGacha(activeBannerId);
      if (data.success) {
        if (data.waifu.rarity === "SSR") setTimeout(() => playSSRWinSound(), 1500);
        setResult({ ...data, isTen: false });
        if (data.remaining_gems !== undefined) setGems(data.remaining_gems);
        if (data.remaining_tickets !== undefined) setTickets(data.remaining_tickets);
        if (data.pulls_until_pity !== undefined) setPullsUntilPity(data.pulls_until_pity);
        window.dispatchEvent(new Event("userUpdated"));
        setTimeout(() => setShowResult(true), 600);
      } else {
        setError(data.error || "Pull gagal.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server backend.");
    } finally {
      setPulling(false);
    }
  };

  const handlePullTen = async () => {
    if (pulling) return;
    setError("");
    setPulling(true);
    setShowResult(false);
    setResult(null);
    playGachaSound();

    try {
      const data = await pullGachaTen(activeBannerId);
      if (data.success) {
        const hasSSR = data.results?.some((r: { waifu: WaifuResult }) => r.waifu.rarity === "SSR");
        if (hasSSR) setTimeout(() => playSSRWinSound(), 1500);
        setResult({ ...data, isTen: true });
        if (data.remaining_gems !== undefined) setGems(data.remaining_gems);
        if (data.remaining_tickets !== undefined) setTickets(data.remaining_tickets);
        if (data.pulls_until_pity !== undefined) setPullsUntilPity(data.pulls_until_pity);
        window.dispatchEvent(new Event("userUpdated"));
        setTimeout(() => setShowResult(true), 600);
      } else {
        setError(data.error || "Pull 10x gagal.");
      }
    } catch {
      setError("Tidak bisa terhubung ke server backend.");
    } finally {
      setPulling(false);
    }
  };

  const rarity = result?.waifu?.rarity || "R";
  const cfg = rarityConfig[rarity] || rarityConfig.R;

  const ssrChara = activeBanner?.waifus.find((w) => w.rarity === "SSR");
  const srChara  = activeBanner?.waifus.find((w) => w.rarity === "SR");
  const rChara   = activeBanner?.waifus.find((w) => w.rarity === "R");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">

      {/* ── Smooth animated background orbs ──────────────────── */}
      <div
        className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: theme.orbColor1,
          transition: "background 900ms cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: theme.orbColor2,
          transition: "background 900ms cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Gacha Waifu</h1>
          <p className="text-gray-400">Pilih banner favoritmu dan kumpulkan karakter spesial!</p>
        </div>

        {/* ── Banner Selector Tabs ───────────────────────────── */}
        {banners.length > 1 && (
          <div className="flex gap-3 mb-8 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            {banners.map((banner) => {
              const isActive = banner.id === activeBannerId;
              const t = bannerThemes[banner.theme_color] ?? bannerThemes.blue;
              return (
                <button
                  key={banner.id}
                  onClick={() => switchBanner(banner.id)}
                  disabled={isTransitioning}
                  style={isActive ? {
                    background: t.bg,
                    boxShadow: `0 0 20px ${t.glowColor}`,
                    border: "1px solid rgba(255,255,255,0.18)",
                    transition: "all 400ms cubic-bezier(0.4,0,0.2,1)",
                  } : { transition: "all 400ms cubic-bezier(0.4,0,0.2,1)" }}
                  className={`flex flex-col items-start px-5 py-3 rounded-xl min-w-[160px] cursor-pointer ${
                    isActive ? "scale-[1.02]" : "hover:bg-white/5 opacity-60 hover:opacity-100 hover:scale-[1.01]"
                  } transition-all duration-400 disabled:cursor-wait`}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest mb-0.5 transition-colors duration-500"
                    style={{ color: isActive ? t.accent : "#6b7280" }}
                  >
                    {banner.theme_color === "blue" ? "⭐ Standard" : "🌟 Event"}
                  </span>
                  <span className={`font-extrabold text-sm leading-tight transition-colors duration-500 ${isActive ? "text-white" : "text-gray-400"}`}>
                    {banner.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Banner Card with fade+slide transition ─────────── */}
        <div
          style={{
            opacity: bannerVisible ? 1 : 0,
            transform: bannerVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
            transition: "opacity 400ms cubic-bezier(0.4,0,0.2,1), transform 400ms cubic-bezier(0.4,0,0.2,1)",
          }}
          className="w-full"
        >
          {activeBanner && (
            <div
              className="relative w-full aspect-[16/7] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8"
              style={{
                background: theme.bg,
                boxShadow: `0 25px 60px ${theme.glowColor}, 0 0 0 1px rgba(255,255,255,0.05)`,
                transition: "background 700ms cubic-bezier(0.4,0,0.2,1), box-shadow 700ms ease",
              }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10 pointer-events-none" />

              {/* Left: Info */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 max-w-[45%]">
                <div
                  className="inline-block px-3 py-1 rounded text-xs font-bold text-white mb-3 uppercase tracking-wider"
                  style={{ background: theme.badgeGradient }}
                >
                  🔥 Rate Up!
                </div>
                <h2
                  className="text-3xl md:text-4xl font-black italic tracking-wide mb-2 drop-shadow-lg"
                  style={{ color: theme.titleColor, transition: "color 500ms ease" }}
                >
                  {activeBanner.name.split(" ").map((word, i) => (
                    <span key={i}>{word}<br /></span>
                  ))}
                </h2>
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{activeBanner.description}</p>
              </div>

              {/* Right: Character Portraits */}
              <div className="absolute right-6 inset-y-0 flex items-center w-[280px] sm:w-[360px]">
                {/* R - back left */}
                {rChara && (
                  <div
                    className="absolute right-44 sm:right-56 top-1/2 -translate-y-1/2 w-24 sm:w-32 aspect-square rounded-full border-2 border-blue-400/50 overflow-hidden opacity-70 hover:opacity-100 hover:scale-110 hover:z-30 cursor-pointer"
                    style={{
                      transition: "opacity 500ms ease, transform 300ms ease",
                      boxShadow: "0 0 20px rgba(59,130,246,0.3)",
                    }}
                  >
                    <img src={rChara.image_url} alt={rChara.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = "none"} />
                    <div className="absolute bottom-0 w-full bg-blue-500/80 text-center text-[10px] font-bold py-0.5">R</div>
                  </div>
                )}

                {/* SR - back right */}
                {srChara && (
                  <div
                    className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-28 sm:w-36 aspect-square rounded-full border-2 border-purple-400/60 overflow-hidden opacity-85 hover:opacity-100 hover:scale-110 hover:z-30 cursor-pointer"
                    style={{
                      transition: "opacity 500ms ease, transform 300ms ease",
                      boxShadow: "0 0 25px rgba(168,85,247,0.4)",
                    }}
                  >
                    <img src={srChara.image_url} alt={srChara.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = "none"} />
                    <div className="absolute bottom-0 w-full bg-purple-500/80 text-center text-[10px] font-bold py-0.5">SR</div>
                  </div>
                )}

                {/* SSR - front center */}
                {ssrChara && (
                  <div
                    className="absolute right-20 sm:right-28 top-1/2 -translate-y-1/2 w-36 sm:w-48 aspect-square rounded-full border-4 border-yellow-400/80 overflow-hidden z-20 cursor-pointer hover:scale-105"
                    style={{
                      transition: "transform 300ms ease",
                      boxShadow: `0 0 40px rgba(250,204,21,0.6), 0 0 80px ${theme.glowColor}`,
                    }}
                  >
                    <img src={ssrChara.image_url} alt={ssrChara.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = "none"} />
                    <div className="absolute bottom-0 w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold py-1 text-center">SSR ⭐</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Error ─────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm text-center mb-6 w-full max-w-md animate-[fadeIn_0.3s_ease]">
            {error}
          </div>
        )}


        {/* ── Result Card ───────────────────────────────────── */}
        {result && (
          <div className={`transition-all duration-700 ${showResult ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"} mb-10 w-full`}>
            {/* ── 1x result ── */}
            {!result.isTen && result.waifu && (
              <div className="flex flex-col items-center">
                <div className={`relative mx-auto w-60 aspect-[3/4] rounded-2xl overflow-hidden border-2 ${cfg.border} ${cfg.glow}`}>
                  <div className={`absolute inset-0 bg-gradient-to-b ${cfg.gradient} opacity-20`} />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold">{cfg.label}</div>
                  {result.is_pity && (
                    <div className="absolute top-3 right-3 bg-yellow-500/80 text-black text-[10px] font-bold px-2 py-0.5 rounded">PITY!</div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <div className={`relative w-24 h-24 rounded-full bg-gradient-to-tr ${cfg.gradient} opacity-90 mb-4 overflow-hidden border-2 border-white/20`}>
                      <img src={result.waifu.image_url} alt={result.waifu.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <h3 className="text-xl font-bold text-white z-10">{result.waifu.name}</h3>
                    <p className="text-xs text-gray-300 mt-1 text-center z-10">{result.waifu.description}</p>
                    {result.is_duplicate && (
                      <p className="mt-3 text-xs bg-black/60 px-3 py-1 rounded-full text-pink-300 z-10 border border-pink-500/30">
                        +10 Affection (Duplikat)
                      </p>
                    )}
                  </div>
                  <div className={`absolute bottom-0 w-full h-1/3 bg-gradient-to-t ${cfg.gradient} opacity-30`} />
                </div>
                <div className="text-center mt-4">
                  <Link href="/inventory" className="text-pink-400 font-semibold text-sm hover:text-pink-300">Lihat di Koleksi →</Link>
                </div>
              </div>
            )}

            {/* ── 10x result grid ── */}
            {result.isTen && result.results && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-400 font-semibold">✨ Hasil 10x Pull</p>
                <div className="grid grid-cols-5 gap-2 w-full max-w-2xl">
                  {result.results.map((r, i) => {
                    const rc = rarityConfig[r.waifu.rarity] ?? rarityConfig.R;
                    return (
                      <div key={i} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 ${rc.border} ${rc.glow}`}>
                        <div className={`absolute inset-0 bg-gradient-to-b ${rc.gradient} opacity-20`} />
                        <div className="absolute top-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[9px] font-bold leading-none">{r.waifu.rarity}</div>
                        {r.is_pity && <div className="absolute top-1 right-1 bg-yellow-500/80 text-black text-[8px] font-bold px-1 rounded">P!</div>}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 mb-1">
                            <img src={r.waifu.image_url} alt={r.waifu.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          </div>
                          <p className="text-[10px] font-bold text-white text-center leading-tight line-clamp-2">{r.waifu.name}</p>
                          {r.is_duplicate && <p className="text-[8px] text-pink-300 mt-0.5">Duplikat</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link href="/inventory" className="text-pink-400 font-semibold text-sm hover:text-pink-300">Lihat di Koleksi →</Link>
              </div>
            )}
          </div>
        )}

        {/* ── Pull Buttons ──────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          {/* 1x Pull */}
          <button
            onClick={handlePull}
            disabled={pulling || (tickets === 0 && gems !== null && gems < 160)}
            id="pull-1x-btn"
            className="relative group w-full md:w-72 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              boxShadow: `0 0 20px rgba(255,255,255,0.05), 0 0 40px ${theme.glowColor}`,
              transition: "all 300ms ease",
            }}
          >
            {pulling ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-bold">Menarik...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="font-bold text-lg">Pull 1x</span>
                {tickets > 0 ? (
                  <span className="text-xs text-pink-400 font-bold">🎫 1 Tiket Gacha</span>
                ) : (
                  <span className="text-xs text-blue-400 font-bold">💎 160 Gems</span>
                )}
              </div>
            )}
          </button>

          {/* 10x Pull */}
          <button
            onClick={handlePullTen}
            disabled={pulling || (tickets < 10 && gems !== null && gems < 1500)}
            id="pull-10x-btn"
            className="relative group w-full md:w-72 h-16 rounded-full overflow-hidden bg-gradient-to-r from-pink-600/30 to-purple-600/30 border border-pink-500/40 backdrop-blur-md transition-all hover:from-pink-600/50 hover:to-purple-600/50 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              boxShadow: `0 0 25px rgba(236,72,153,0.2), 0 0 50px ${theme.glowColor}`,
              transition: "all 300ms ease",
            }}
          >
            {pulling ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-pink-300/30 border-t-pink-400 rounded-full animate-spin" />
                <span className="font-bold">Menarik...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="font-bold text-lg">Pull 10x <span className="text-xs bg-pink-500/50 px-1.5 py-0.5 rounded-full ml-1">Dijamin SR+</span></span>
                {tickets >= 10 ? (
                  <span className="text-xs text-pink-300 font-bold">🎫 10 Tiket Gacha</span>
                ) : (
                  <span className="text-xs text-purple-300 font-bold">💎 1500 Gems <span className="text-green-400">(Hemat 100!)</span></span>
                )}
              </div>
            )}
          </button>

          <p className="text-sm text-gray-400 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
            Jaminan SSR dalam{" "}
            <span className="text-yellow-400 font-bold text-lg">{pullsUntilPity}</span> tarikan.
          </p>
        </div>

        {/* ── Info Section (smooth fade when banner changes) ─── */}
        <div
          style={{
            opacity: bannerVisible ? 1 : 0,
            transition: "opacity 400ms ease",
          }}
          className="w-full mt-16 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm"
        >
          {activeBanner && (
            <>
              <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <span>📊</span> Informasi Banner:{" "}
                <span style={{ color: theme.accent, transition: "color 500ms ease" }}>{activeBanner.name}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Drop Rates */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: theme.accent, transition: "color 500ms ease" }}>
                    Peluang Karakter
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-yellow-500/20">
                      <span className="font-bold text-yellow-400">SSR (Super Super Rare)</span>
                      <span className="font-mono text-white">5%</span>
                    </li>
                    <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-purple-500/20">
                      <span className="font-bold text-purple-400">SR (Super Rare)</span>
                      <span className="font-mono text-white">25%</span>
                    </li>
                    <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-blue-500/20">
                      <span className="font-bold text-blue-400">R (Rare)</span>
                      <span className="font-mono text-white">70%</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                    * Tarikan ke-50 dijamin SSR jika belum dapat (Pity System).
                  </div>
                </div>

                {/* Character List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: theme.accent }}>
                    Karakter di Banner Ini
                  </h3>
                  <div className="space-y-3">
                    {activeBanner.waifus.map((w) => {
                      const rc = rarityConfig[w.rarity] ?? rarityConfig.R;
                      return (
                        <div
                          key={w.id}
                          className={`flex gap-4 items-start bg-black/40 p-3 rounded-lg border ${
                            w.rarity === "SSR" ? "border-yellow-500/20" : w.rarity === "SR" ? "border-purple-500/20" : "border-blue-500/20"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${rc.border} flex-shrink-0`}>
                            <img src={w.image_url} alt={w.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = "none"} />
                          </div>
                          <div>
                            <h4 className={`font-bold leading-tight ${
                              w.rarity === "SSR" ? "text-yellow-400" : w.rarity === "SR" ? "text-purple-400" : "text-blue-400"
                            }`}>
                              {w.name}{" "}
                              <span className={`text-xs px-1.5 py-0.5 rounded bg-gradient-to-r ${rc.gradient} text-white`}>
                                {w.rarity}
                              </span>
                            </h4>
                            <p className="text-xs text-gray-300 mt-1">{w.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
