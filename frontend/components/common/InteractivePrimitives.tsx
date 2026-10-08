"use client";

import React, { useEffect, useState } from "react";

export function SmoothScrollAndSpotlight({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative min-h-screen">{children}</div>;
}

export function MagneticButton({
  children,
  className = "",
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`transition-all duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_3px_8px_rgba(4,33,38,0.1)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#209b47] ${className}`}
    >
      {children}
    </button>
  );
}

export function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`transition-all duration-150 ease-out hover:-translate-y-[2px] hover:border-[#acf2e5] hover:shadow-[0_6px_18px_rgba(4,33,38,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 500,
  formatFn,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatFn?: (val: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number | null = null;
    let rafId = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  const formatted = formatFn
    ? formatFn(displayValue)
    : displayValue.toLocaleString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
