"use client";

import { useEffect, useRef, useState } from "react";

type ConfettiParticle = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
};

const COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b"];

interface ConfettiProps {
  duration?: number;
  count?: number;
  onComplete?: () => void;
}

export function Confetti({ duration = 3000, count = 50, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
    }));

    setParticles(newParticles);

    const timer = window.setTimeout(() => {
      setParticles([]);
      onCompleteRef.current?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [count, duration]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" aria-hidden>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle absolute h-3 w-3 rounded-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
}
