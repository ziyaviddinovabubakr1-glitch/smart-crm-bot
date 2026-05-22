"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { BackgroundPreference } from "@/types";

export type LivingBackgroundType =
  | "aurora"
  | "ocean"
  | "sunset"
  | "forest"
  | "neon"
  | "particles"
  | "gradient"
  | "minimal"
  | "solid"
  | "mesh";

interface LivingBackgroundProps {
  type?: LivingBackgroundType | BackgroundPreference;
  children?: ReactNode;
  opacity?: number;
}

const gradients: Record<LivingBackgroundType, string> = {
  aurora: "from-purple-600 via-pink-600 to-blue-600",
  ocean: "from-cyan-600 via-blue-600 to-indigo-600",
  sunset: "from-orange-500 via-pink-500 to-purple-600",
  forest: "from-green-600 via-emerald-600 to-teal-600",
  neon: "from-fuchsia-600 via-purple-600 to-pink-600",
  particles: "from-violet-600 via-fuchsia-600 to-cyan-600",
  gradient: "from-blue-600 via-purple-600 to-pink-600",
  minimal: "from-neutral-200 via-neutral-100 to-neutral-200",
  solid: "from-slate-300 via-slate-200 to-slate-300",
  mesh: "from-indigo-300 via-violet-200 to-blue-300",
};

export function toLivingBackgroundType(
  preference?: BackgroundPreference | string | null
): LivingBackgroundType {
  if (!preference) return "aurora";
  if (preference in gradients) return preference as LivingBackgroundType;
  return "aurora";
}

export function LivingBackground({
  type = "aurora",
  children,
  opacity = 0.3,
}: LivingBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const resolvedType = toLivingBackgroundType(type);
  const resolvedOpacity =
    resolvedType === "minimal" || resolvedType === "solid" ? Math.min(opacity, 0.2) : opacity;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const showExtraOrbs = resolvedType === "particles" || resolvedType === "neon";
  const showMesh = resolvedType === "mesh" || resolvedType === "aurora";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`living-gradient-bg absolute inset-0 bg-gradient-to-br ${gradients[resolvedType]}`}
          style={{ opacity: resolvedOpacity }}
        />

        <div
          className="absolute h-96 w-96 rounded-full bg-white/20 blur-3xl"
          style={{
            top: `${20 + mousePos.y * 0.2}%`,
            left: `${10 + mousePos.x * 0.2}%`,
            transition: "all 0.5s ease-out",
          }}
        />
        <div
          className="absolute h-80 w-80 rounded-full bg-white/10 blur-3xl"
          style={{
            top: `${60 - mousePos.y * 0.15}%`,
            right: `${15 - mousePos.x * 0.15}%`,
            transition: "all 0.5s ease-out",
          }}
        />
        <div
          className="absolute h-64 w-64 rounded-full bg-white/15 blur-3xl"
          style={{
            bottom: `${10 + mousePos.y * 0.1}%`,
            left: `${40 + mousePos.x * 0.1}%`,
            transition: "all 0.5s ease-out",
          }}
        />

        {showExtraOrbs && (
          <>
            <div
              className="absolute h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl"
              style={{
                top: `${35 + mousePos.y * 0.08}%`,
                right: `${30 + mousePos.x * 0.08}%`,
                transition: "all 0.6s ease-out",
              }}
            />
            <div
              className="absolute h-56 w-56 rounded-full bg-pink-300/20 blur-2xl"
              style={{
                bottom: `${25 - mousePos.y * 0.06}%`,
                right: `${40 - mousePos.x * 0.06}%`,
                transition: "all 0.6s ease-out",
              }}
            />
          </>
        )}

        {showMesh && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
        )}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
