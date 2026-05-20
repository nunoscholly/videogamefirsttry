"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** target value the ticker drifts toward */
  to: number;
  /** initial value to count from on first paint */
  from?: number;
  /** decimal places */
  decimals?: number;
  /** thousands separator */
  group?: boolean;
  /** prefix (e.g. "$") */
  prefix?: string;
  /** suffix (e.g. "%") */
  suffix?: string;
  /** drift band — random walk amplitude after settling */
  drift?: number;
  /** ms for initial count-up */
  duration?: number;
  className?: string;
};

const fmt = (n: number, decimals: number, group: boolean) => {
  const fixed = n.toFixed(decimals);
  if (!group) return fixed;
  const [whole, dec] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
};

export function Ticker({
  to,
  from = 0,
  decimals = 0,
  group = true,
  prefix = "",
  suffix = "",
  drift = 0,
  duration = 1600,
  className = "",
}: Props) {
  const [value, setValue] = useState(from);
  const settledRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else settledRef.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration]);

  useEffect(() => {
    if (drift <= 0) return;
    const id = setInterval(() => {
      if (!settledRef.current) return;
      const jitter = (Math.random() - 0.5) * 2 * drift;
      setValue(to + jitter);
    }, 900 + Math.random() * 800);
    return () => clearInterval(id);
  }, [to, drift]);

  return (
    <span className={`mono tabular-nums ${className}`}>
      {prefix}
      {fmt(value, decimals, group)}
      {suffix}
    </span>
  );
}
