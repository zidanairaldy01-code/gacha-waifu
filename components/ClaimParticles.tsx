"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  distance: number;
};

const EMOJIS = ["💎", "⭐", "✨", "🌟", "🎫", "🎁", "💫"];

export default function ClaimParticles({ trigger, type = "gems" }: { trigger: number; type?: "gems" | "ticket" | "daily" }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const emojiSet =
    type === "ticket" ? ["🎫", "✨", "🌟"] :
    type === "daily"  ? ["💎", "⭐", "🎁", "⚡"] :
                        ["💎", "✨", "⭐", "💫"];

  useEffect(() => {
    if (trigger === 0) return;

    const newParticles: Particle[] = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: 50, // center %
      y: 50, // center %
      emoji: emojiSet[i % emojiSet.length],
      angle: (i / 16) * 360,
      distance: 80 + Math.random() * 120,
    }));

    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 1400);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: [1, 1.4, 0.6],
              x: tx,
              y: ty,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none fixed z-[9999] text-2xl select-none"
            style={{
              left: `calc(${p.x}% + ${Math.random() * 60 - 30}px)`,
              top:  `calc(${p.y}% + ${Math.random() * 60 - 30}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {p.emoji}
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
