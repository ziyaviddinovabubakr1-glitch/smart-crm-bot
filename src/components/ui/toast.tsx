"use client";

import { useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const colors: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onCloseRef.current(), 300);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${colors[type]} transform rounded-lg px-6 py-3 text-white shadow-2xl transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden>{icons[type]}</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
