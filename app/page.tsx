"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getMe, claimDailyReward } from "@/lib/api";
import { playClaimSound } from "@/lib/audio";
import ClaimParticles from "@/components/ClaimParticles";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");
  const [claimTrigger, setClaimTrigger] = useState(0);

  const fetchUser = () => {
    if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
      getMe().then((data) => {
        if (data.id) setUser(data);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener("userUpdated", fetchUser);
    return () => window.removeEventListener("userUpdated", fetchUser);
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    const data = await claimDailyReward();
    if (data.success) {
      playClaimSound();
      setClaimTrigger((t) => t + 1);
      setMessage(data.message);
      window.dispatchEvent(new Event("userUpdated")); // Refresh nav bar
      fetchUser(); // Refresh local user state
    } else {
      setMessage(data.error || "Klaim gagal");
    }
    setClaiming(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const today = new Date().toISOString().split("T")[0];
  const canClaim = user && user.last_claim_date !== today;
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative font-sans selection:bg-pink-500 selection:text-white">
      <ClaimParticles trigger={claimTrigger} type="daily" />
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 flex flex-col gap-8 md:pr-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500" />
            </span>
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">AI LLM + Gacha System</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
            Kumpulkan & Chat Dengan <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
              Waifu Impianmu
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
            Rasakan pengalaman gacha generasi berikutnya. Dapatkan waifu unik dengan kepribadian dinamis,
            dan berinteraksi langsung melalui AI chatbot yang memiliki ingatan dan emosi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/gacha" className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 font-bold text-white transition-all hover:scale-105 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
              <span className="mr-2">Tarik Gacha Sekarang</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link href="/inventory" className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-8 font-bold text-white transition-all hover:bg-white/10">
              Lihat Koleksi
            </Link>
          </div>

          {/* Daily Claim Section */}
          {user && (
            <div className="mt-4">
              <button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  canClaim 
                    ? "bg-gradient-to-r from-yellow-400 to-amber-600 text-black shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:scale-105" 
                    : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <span>🎁</span>
                {claiming ? "Mengklaim..." : canClaim ? "Klaim Hadiah Harian!" : "Hadiah Harian Telah Diambil"}
              </button>
              {message && <p className="mt-2 text-sm text-yellow-400">{message}</p>}
            </div>
          )}
        </div>

        {/* Hero Card */}
        <div className="flex-1 relative w-full max-w-md">
          <div className="relative w-full aspect-[3/4] rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl shadow-2xl overflow-hidden group">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-extrabold px-3 py-1 rounded-lg text-sm shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10">
              SSR
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
              <div className="w-32 h-32 rounded-full border-2 border-white/20 bg-white/5 mb-6 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                <img 
                  src="/images/waifus/luna.jpg" 
                  alt="Luna" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Luna</h3>
              <p className="text-sm text-pink-400 font-medium mb-4">Penyihir Void • AI Chat Active</p>
              <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-400 italic">
                  &ldquo;...Kamu sudah sampai juga. Aku sudah menunggu di antara bintang-bintang.&rdquo;
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-pink-600/40 to-transparent pointer-events-none" />
          </div>
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
      </main>
    </div>
  );
}
