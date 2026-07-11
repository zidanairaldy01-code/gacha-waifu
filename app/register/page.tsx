"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConf) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const data = await register(name, email, password, passwordConf);
      if (data.success) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        const messages = data.errors
          ? Object.values(data.errors as Record<string, string[]>).flat().join(" ")
          : data.message || "Pendaftaran gagal.";
        setError(messages);
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.5)]">
              AI
            </div>
            <span className="font-bold text-xl tracking-wider">WaifuGacha</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Buat Akun Baru</h1>
          <p className="text-gray-400 text-sm">Mulai perjalanan gacha-mu sekarang. Gratis 1,600 Gems!</p>
        </div>

        {/* Gems Banner */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl px-5 py-3 flex items-center gap-3 mb-6">
          <span className="text-2xl">💎</span>
          <div>
            <p className="font-bold text-yellow-400">1,600 Gems Gratis!</p>
            <p className="text-xs text-gray-400">Cukup untuk 10x pull pertamamu.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_25px_50px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Nama</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nama panggilanmu"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimal 8 karakter"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Konfirmasi Password</label>
              <input
                type="password"
                id="password-confirm"
                value={passwordConf}
                onChange={(e) => setPasswordConf(e.target.value)}
                required
                placeholder="Ulangi password"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-btn"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white transition-all hover:scale-105 shadow-[0_0_25px_rgba(236,72,153,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mendaftar...</span>
                </div>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-pink-400 font-semibold hover:text-pink-300 transition-colors">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
