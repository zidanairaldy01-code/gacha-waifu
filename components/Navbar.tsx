"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getMe } from "@/lib/api";
import QuestsModal from "./QuestsModal";
import MailModal from "./MailModal";
import TopUpModal from "./TopUpModal";

const MAX_ENERGY = 100;
const REGEN_INTERVAL_MS = 10 * 60; // 10 menit dalam detik

function getSecondsUntilNextRegen(lastRegenIso: string | null): number {
  if (!lastRegenIso) return REGEN_INTERVAL_MS;
  const lastRegen = new Date(lastRegenIso).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - lastRegen) / 1000);
  const remaining = REGEN_INTERVAL_MS - (elapsed % REGEN_INTERVAL_MS);
  return remaining;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: number; name: string; username: string; energy: number; gems: number;
    tickets: number; last_energy_regen: string | null;
    unread_mail_count?: number;
    showcase_waifu_ids?: number[];
  } | null>(null);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isMailsOpen, setIsMailsOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [countdown, setCountdown] = useState<number>(REGEN_INTERVAL_MS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchUser = () => {
      if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
        getMe()
          .then((data) => {
            if (data.id) {
              setUser(data);
              setCountdown(getSecondsUntilNextRegen(data.last_energy_regen));
            }
          })
          .catch(() => {});
      }
    };

    fetchUser();
    window.addEventListener("userUpdated", fetchUser);
    return () => window.removeEventListener("userUpdated", fetchUser);
  }, [pathname]);

  // Hitung mundur real-time setiap detik
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!user || user.energy >= MAX_ENERGY) return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Waktunya regen: refresh data dari server
          window.dispatchEvent(new Event("userUpdated"));
          return REGEN_INTERVAL_MS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      setUser(null);
      router.push("/login");
    }
  };

  if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/chat")) {
    return null;
  }

  return (
    <>
      <nav className="w-full px-6 py-4 flex items-center justify-between z-40 relative backdrop-blur-md bg-black/30 border-b border-white/5 sticky top-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black italic tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:scale-105 transition-transform cursor-pointer">
            GACHA WAIFU
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/gacha"
              className={`transition-colors ${pathname === "/gacha" ? "text-pink-400" : "text-gray-400 hover:text-white"}`}
            >
              Gacha
            </Link>
            <Link
              href="/inventory"
              className={`transition-colors ${pathname === "/inventory" ? "text-pink-400" : "text-gray-400 hover:text-white"}`}
            >
              Koleksi
            </Link>
            {user?.username && (
              <Link
                href={`/profile/${user.username}`}
                className={`transition-colors ${pathname?.startsWith("/profile") ? "text-pink-400" : "text-gray-400 hover:text-white"}`}
              >
                Profil
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-sm shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors flex items-center gap-1 group"
                  title="Top Up Gems"
                >
                  💎 {user.gems}
                  <span className="text-[10px] text-yellow-600 group-hover:text-yellow-400 transition-colors font-bold">+</span>
                </button>
                <span className="text-gray-500">|</span>
                <span className="text-pink-400 font-bold" title="Tiket Gacha">🎫 {user.tickets ?? 0}</span>
                <span className="text-gray-500">|</span>
                {/* Energy + timer regen */}
                <span className="flex items-center gap-1.5">
                  <span className="text-blue-400 font-bold" title="Energi">
                    ⚡ {user.energy}<span className="text-gray-500 font-normal text-xs">/{MAX_ENERGY}</span>
                  </span>
                  {user.energy < MAX_ENERGY && (
                    <span className="text-xs text-cyan-400 font-mono bg-cyan-400/10 px-1.5 py-0.5 rounded-md border border-cyan-400/20" title="Waktu regen berikutnya">
                      +1 {formatCountdown(countdown)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMailsOpen(true)}
                  className="relative text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors w-9 h-9 flex items-center justify-center rounded-full border border-white/5 text-white"
                  title="Kotak Surat"
                >
                  ✉️
                  {user.unread_mail_count ? (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-[#0a0a0a] rounded-full"></span>
                  ) : null}
                </button>

                <button
                  onClick={() => setIsQuestsOpen(true)}
                  className="text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full border border-white/5 text-white"
                >
                  📜 Misi
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-semibold text-white">
              Login
            </Link>
          )}
        </div>
      </nav>
      <QuestsModal isOpen={isQuestsOpen} onClose={() => setIsQuestsOpen(false)} />
      <MailModal isOpen={isMailsOpen} onClose={() => {
        setIsMailsOpen(false);
        window.dispatchEvent(new Event("userUpdated"));
      }} />
      <TopUpModal isOpen={isTopUpOpen} onClose={() => {
        setIsTopUpOpen(false);
        window.dispatchEvent(new Event("userUpdated"));
      }} />
    </>
  );
}
