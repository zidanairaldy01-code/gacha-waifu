"use client";

import { useState } from "react";
import { processTopUp } from "@/lib/api";

interface GemPackage {
  id: string;
  gems: number;
  bonus: number;
  price: number; // IDR
  label?: string;
  popular?: boolean;
  bestValue?: boolean;
}

const GEM_PACKAGES: GemPackage[] = [
  { id: "pack_60",    gems: 60,    bonus: 0,    price: 15000,  label: "Starter" },
  { id: "pack_300",   gems: 300,   bonus: 30,   price: 65000,  label: "Petualang" },
  { id: "pack_980",   gems: 980,   bonus: 110,  price: 179000, label: "Kesatria", popular: true },
  { id: "pack_1980",  gems: 1980,  bonus: 260,  price: 349000, label: "Ksatria Agung" },
  { id: "pack_3280",  gems: 3280,  bonus: 600,  price: 579000, label: "Raja", bestValue: true },
  { id: "pack_6480",  gems: 6480,  bonus: 1600, price: 1099000, label: "Kaisar" },
];

type PaymentStep = "select" | "confirm" | "loading" | "success" | "error";

export default function TopUpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedPack, setSelectedPack] = useState<GemPackage | null>(null);
  const [step, setStep] = useState<PaymentStep>("select");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state when closing
    setTimeout(() => {
      setSelectedPack(null);
      setStep("select");
      setErrorMessage("");
    }, 300);
    onClose();
  };

  const handleSelectPack = (pack: GemPackage) => {
    setSelectedPack(pack);
    setStep("confirm");
  };

  const handlePay = async () => {
    if (!selectedPack) return;
    setStep("loading");

    try {
      const data = await processTopUp(selectedPack.id);
      if (data.success) {
        setStep("success");
        // Refresh navbar gems
        window.dispatchEvent(new Event("userUpdated"));
      } else {
        setErrorMessage(data.error || "Pembayaran gagal, silakan coba lagi.");
        setStep("error");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setStep("error");
    }
  };

  const handleBack = () => {
    setSelectedPack(null);
    setStep("select");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={step === "loading" ? undefined : handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0d0d14] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decorative top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full" />

        {/* ── SELECT PACKAGE STEP ─────────────────────────── */}
        {step === "select" && (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">💎</span> Top Up Gems
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Pilih paket gems favoritmu</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GEM_PACKAGES.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => handleSelectPack(pack)}
                    className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-left group
                      ${pack.popular
                        ? "bg-gradient-to-b from-indigo-900/60 to-purple-900/40 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        : pack.bestValue
                        ? "bg-gradient-to-b from-amber-900/50 to-yellow-900/30 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
                      }`}
                  >
                    {/* Badges */}
                    {pack.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        TERPOPULER
                      </div>
                    )}
                    {pack.bestValue && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        BEST VALUE
                      </div>
                    )}

                    {/* Gem Icon */}
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">💎</span>

                    {/* Package Label */}
                    <span className="text-xs text-gray-400 mb-0.5">{pack.label}</span>

                    {/* Gems Count */}
                    <span className="text-white font-extrabold text-lg leading-tight">
                      {pack.gems.toLocaleString("id-ID")}
                    </span>

                    {/* Bonus */}
                    {pack.bonus > 0 && (
                      <span className="text-xs text-green-400 font-semibold mt-0.5">
                        +{pack.bonus.toLocaleString("id-ID")} Bonus
                      </span>
                    )}

                    {/* Total Gems */}
                    {pack.bonus > 0 && (
                      <span className="text-[10px] text-gray-500 mt-1">
                        Total: {(pack.gems + pack.bonus).toLocaleString("id-ID")} 💎
                      </span>
                    )}

                    {/* Price */}
                    <div className="mt-3 w-full pt-3 border-t border-white/10 text-center">
                      <span className={`font-bold text-sm ${pack.popular ? "text-indigo-300" : pack.bestValue ? "text-yellow-400" : "text-white"}`}>
                        {formatPrice(pack.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-600 mt-6">
                💡 Ini adalah simulasi top-up — tidak ada transaksi nyata yang terjadi.
              </p>
            </div>
          </>
        )}

        {/* ── CONFIRM STEP ─────────────────────────────────── */}
        {step === "confirm" && selectedPack && (
          <div className="p-8 flex flex-col items-center">
            <button
              onClick={handleBack}
              className="self-start text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-6 transition-colors"
            >
              ← Kembali
            </button>

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold mb-1">Konfirmasi Pembayaran</h2>
              <p className="text-gray-500 text-sm">Pastikan paket yang kamu pilih sudah benar.</p>
            </div>

            {/* Order Card */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl">
                  💎
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Paket</p>
                  <p className="font-bold text-lg text-white">{selectedPack.label}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Gems</span>
                  <span className="font-semibold text-white">{selectedPack.gems.toLocaleString("id-ID")} 💎</span>
                </div>
                {selectedPack.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bonus</span>
                    <span className="font-semibold text-green-400">+{selectedPack.bonus.toLocaleString("id-ID")} 💎</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">Total Gems</span>
                  <span className="font-bold text-yellow-400 text-base">
                    {(selectedPack.gems + selectedPack.bonus).toLocaleString("id-ID")} 💎
                  </span>
                </div>
              </div>
            </div>

            {/* Method (fake) */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Metode Pembayaran</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-base">🏦</div>
                <div>
                  <p className="text-sm font-semibold text-white">Virtual Account (Simulasi)</p>
                  <p className="text-xs text-gray-500">Pembayaran instan, hanya untuk demo</p>
                </div>
                <div className="ml-auto w-4 h-4 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-gray-400 text-sm">Total Pembayaran</span>
              <span className="text-2xl font-extrabold text-white">{formatPrice(selectedPack.price)}</span>
            </div>

            <button
              onClick={handlePay}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
            >
              Bayar Sekarang 💳
            </button>

            <p className="text-xs text-gray-600 mt-4 text-center">
              Dengan melanjutkan, kamu setuju bahwa ini hanya simulasi.
            </p>
          </div>
        )}

        {/* ── LOADING STEP ─────────────────────────────────── */}
        {step === "loading" && (
          <div className="p-16 flex flex-col items-center justify-center gap-6">
            {/* Pulsing gem */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-5xl animate-pulse">
                💎
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">Memproses Pembayaran...</p>
              <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
            </div>
            {/* Progress bar */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[loadbar_2.5s_ease-in-out_forwards]" />
            </div>
          </div>
        )}

        {/* ── SUCCESS STEP ─────────────────────────────────── */}
        {step === "success" && selectedPack && (
          <div className="p-12 flex flex-col items-center justify-center gap-5">
            {/* Success icon with rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full border-2 border-green-500/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full border-2 border-green-500/30" />
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-4xl">
                ✓
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white mb-1">Pembayaran Berhasil! 🎉</h2>
              <p className="text-gray-400 text-sm">Gems berhasil ditambahkan ke akunmu.</p>
            </div>

            {/* Gems received card */}
            <div className="bg-gradient-to-br from-yellow-900/40 to-amber-900/20 border border-yellow-500/30 rounded-2xl px-8 py-4 text-center shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <p className="text-xs text-gray-400 mb-1">Gems Diterima</p>
              <p className="text-4xl font-extrabold text-yellow-400">
                +{(selectedPack.gems + selectedPack.bonus).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-yellow-500/70 mt-0.5">💎 Gems</p>
            </div>

            <button
              onClick={handleClose}
              className="mt-2 w-full max-w-xs h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold transition-all hover:scale-[1.02]"
            >
              Kembali ke Game
            </button>
          </div>
        )}

        {/* ── ERROR STEP ───────────────────────────────────── */}
        {step === "error" && (
          <div className="p-12 flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-4xl">
              ✕
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white mb-1">Pembayaran Gagal</h2>
              <p className="text-gray-400 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={handleBack}
              className="mt-2 w-full max-w-xs h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold transition-all hover:scale-[1.02]"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes loadbar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
