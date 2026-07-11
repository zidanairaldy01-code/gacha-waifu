# Web Gacha Waifu Berbasis AI

Menggabungkan AI dengan web gacha waifu bisa memberikan pengalaman yang sangat interaktif dan personal bagi pengguna.

Untuk perencanaan, kita bagi ke dalam beberapa fase pengembangan agar eksekusinya terstruktur dan tidak membingungkan. Berikut adalah roadmap planning untuk proyek web gacha waifu berbasis AI:

## 🚀 Fase 1: Konsep Utama & Fitur AI (Core Features)
Sebelum masuk ke kode, tentukan dulu peran AI di dalam web ini. AI tidak hanya sebagai pemanis, tapi sebagai penggerak utama fitur uniknya.

- **AI Persona & Chatbot:** Setiap waifu yang didapatkan dari gacha memiliki kepribadian (Prompt AI) yang unik. Pengguna bisa melakukan chatting interaktif dengan mereka.
- **AI Dynamic Artwork Generator:** Menggunakan AI (seperti Stable Diffusion atau Midjourney API) untuk menghasilkan art waifu baru secara berkala atau membuat variasi skin langka (SSR, UR).
- **AI Voice Generation (Opsional/Fase Lanjut):** Memberikan suara pada waifu menggunakan Text-to-Speech (TTS) AI yang bernuansa anime (misalnya menggunakan ElevenLabs atau model lokal).

## 🛠️ Fase 2: Arsitektur Teknologi (Tech Stack)
Gunakan kombinasi framework yang kuat untuk menangani sistem web dan integrasi API AI.

- **Backend & Gacha Logic:** Laravel (PHP)
  - Sangat cocok untuk mengelola database pengguna, sistem currency (koin/gem untuk gacha), riwayat gacha, dan manajemen inventory waifu.
  - Gunakan Laravel HTTP Client untuk berkomunikasi dengan API AI.
- **Frontend:** Livewire atau Vue.js/React
  - Dibutuhkan interface yang responsif dan mulus saat melakukan animasi gacha pull dan jendela chatting dengan AI.
- **Database:** MySQL atau PostgreSQL
  - Untuk menyimpan data user, tabel kategori, tabel waifu_pool, dan log percakapan chat AI.
- **AI Integration:** OpenAI API (GPT-4o/GPT-3.5) atau Groq API (Llama 3 untuk respons cepat) dengan sistem system prompt yang dikustomisasi sesuai karakter waifu.

## 📊 Fase 3: Struktur Database & Logika Gacha
Desain database harus siap menangani relasi antara user, koleksi waifu, dan memori chat AI.

**Tabel Utama yang Dibutuhkan:**
- `users`: Data akun, saldo koin/gem.
- `waifus`: Data master waifu (Nama, Rarity: R/SR/SSR, Deskripsi, Base Prompt AI, URL Gambar).
- `user_waifu` (Pivot): Koleksi waifu yang dimiliki user (bisa menyimpan level kedekatan/afeksi).
- `chat_histories`: Menyimpan riwayat obrolan user dengan waifu tertentu agar AI memiliki "memori".

**Sistem Gacha (Probability Rate):**
- **R (Rare):** 70%
- **SR (Super Rare):** 25%
- **SSR (Specially Super Rare):** 5%

**Sistem Pity:** Berikan jaminan mendapatkan SSR jika user sudah melakukan gacha sebanyak 50 atau 100 kali tanpa mendapatkannya.

## 💻 Fase 4: Langkah Implementasi (Sprint Plan)

### Minggu 1: Fondasi Sistem & Database
- Setup proyek Laravel baru.
- Buat migrasi database (`users`, `waifus`, `gacha_logs`).
- Buat sistem autentikasi user (Register/Login).
- Isi database waifu pool dengan beberapa karakter awal (bisa menggunakan seeders).

### Minggu 2: Mekanik Gacha & Inventory
- Buat fungsi backend untuk logika acak gacha berdasarkan persentase kelangkaan.
- Buat halaman UI untuk menarik gacha (animasi kartu terbuka).
- Buat halaman Koleksi/Inventory untuk melihat waifu yang sudah didapatkan.

### Minggu 3: Integrasi AI & Fitur Chat
- Hubungkan Laravel dengan API AI (misalnya OpenAI) menggunakan API Key.
- Buat sistem Prompt Engineering. Saat user chat waifu A, kirimkan context: "Kamu adalah [Nama Waifu], sifatmu [Sifat]. Jawab user dengan gaya bicara anime."
- Implementasikan UI Chat yang real-time (bisa memanfaatkan Livewire agar ringan).

### Minggu 4: Polishing, Optimalisasi Gambar & Testing
- Gunakan helper kompresi gambar untuk memastikan artwork waifu yang muncul di web tidak membuat loading menjadi berat.
- Security check: Pastikan saldo gem/koin tidak bisa dimanipulasi dari sisi frontend (proses pengurangan koin harus valid di sisi server/backend).
- Uji coba alur user experience dari daftar, gacha, hingga chatting.

## 💡 Tips Tambahan untuk Proyek Ini
- **Manajemen Biaya API:** Memanggil API AI berbayar setiap kali user nge-chat bisa menguras biaya. Batasi dengan sistem Energi/Stamina. Jadi, user butuh energi untuk nge-chat waifu, dan energi itu bisa terisi ulang per jam atau dibeli dengan koin web.
- **Local AI (Alternatif Bebas Biaya):** Jika ingin hemat biaya API selama masa pengembangan, kamu bisa mencoba menjalankan model lokal seperti Llama 3 menggunakan Ollama di komputer lokal sebagai backend AI-nya.
# gacha-waifu
