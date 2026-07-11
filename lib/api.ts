const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper: ambil token dari localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Helper: buat headers
const getHeaders = (withAuth = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (withAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function claimDailyReward() {
  try {
    const res = await fetch(`${API_URL}/claim-daily`, {
      method: "POST",
      headers: getHeaders(true),
    });
    return await res.json();
  } catch (error) {
    console.error("Claim reward error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function getQuests() {
  try {
    const res = await fetch(`${API_URL}/quests`, { headers: getHeaders(true) });
    return await res.json();
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

export async function claimQuest(questId: string) {
  try {
    const res = await fetch(`${API_URL}/quests/claim`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ quest_id: questId }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}

// ─── AUTH ──────────────────────────────────────────────────────
export const register = async (name: string, email: string, password: string, password_confirmation: string) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });
  return res.json();
};

export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const logout = async () => {
  const res = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(`${API_URL}/me`, {
    headers: getHeaders(true),
  });
  return res.json();
};

// ─── WAIFUS (PUBLIK) ────────────────────────────────────────────
export const getAllWaifus = async () => {
  const res = await fetch(`${API_URL}/waifus`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getWaifu = async (id: number) => {
  const res = await fetch(`${API_URL}/waifus/${id}`, {
    headers: getHeaders(),
  });
  return res.json();
};

// ─── INVENTORY ─────────────────────────────────────────────────
export const getInventory = async () => {
  const res = await fetch(`${API_URL}/inventory`, {
    headers: getHeaders(true),
  });
  return res.json();
};

// ─── GACHA ─────────────────────────────────────────────────────
export const pullGacha = async (bannerId: number = 1) => {
  const res = await fetch(`${API_URL}/gacha/pull`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ banner_id: bannerId }),
  });
  return res.json();
};

export const pullGachaTen = async (bannerId: number = 1) => {
  const res = await fetch(`${API_URL}/gacha/pull-ten`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ banner_id: bannerId }),
  });
  return res.json();
};

export const getBanners = async () => {
  const res = await fetch(`${API_URL}/banners`, {
    headers: getHeaders(false),
  });
  return res.json();
};

// ─── CHAT ──────────────────────────────────────────────────────
export const resolveChatToken = async (token: string) => {
  const res = await fetch(`${API_URL}/chat/resolve/${token}`, {
    headers: getHeaders(true),
  });
  return res.json();
};

export const sendChat = async (token: string, message: string) => {
  const res = await fetch(`${API_URL}/chat/${token}`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ message }),
  });
  return res.json();
};

export const getChatHistory = async (token: string) => {
  const res = await fetch(`${API_URL}/chat/${token}/history`, {
    headers: getHeaders(true),
  });
  return res.json();
};

// ─── MAIL ──────────────────────────────────────────────────────
export const getMails = async () => {
  const res = await fetch(`${API_URL}/mails`, {
    headers: getHeaders(true),
  });
  return res.json();
};

export const claimMail = async (id: number) => {
  const res = await fetch(`${API_URL}/mails/${id}/claim`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  return res.json();
};

// ─── TOP UP ────────────────────────────────────────────────────
export const processTopUp = async (packageId: string) => {
  const res = await fetch(`${API_URL}/topup`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ package_id: packageId }),
  });
  return res.json();
};

// ─── PROFIL ────────────────────────────────────────────────────
export const getProfile = async (username: string) => {
  const res = await fetch(`${API_URL}/profile/${username}`, {
    headers: getHeaders(false),
  });
  return res.json();
};

export const updateShowcase = async (waifuIds: number[]) => {
  const res = await fetch(`${API_URL}/profile/showcase`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify({ waifu_ids: waifuIds }),
  });
  return res.json();
};

// ─── GIFT ──────────────────────────────────────────────────────
export const sendGift = async (receiverUsername: string, amount: number) => {
  const res = await fetch(`${API_URL}/gift/send`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ receiver_username: receiverUsername, amount }),
  });
  return res.json();
};
