"use client";
import React, { useEffect, useMemo, useState } from "react";
import { splash, splashCopy } from "../../styles/tokens/splash";
import { track } from "../lib/analytics";

const SPLASH_MIN_FIRST = 800; // ms
const SPLASH_MIN_REPEAT = 400;
const SPLASH_MAX = 1800;

export default function SplashMobile({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  const msg = useMemo(() => splashCopy[Math.floor(Math.random() * splashCopy.length)], []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fast = params.get("fast") === "true";
    const seen = window.sessionStorage.getItem("jizai:splash-seen");
    const min = fast ? SPLASH_MIN_REPEAT : seen ? SPLASH_MIN_REPEAT : SPLASH_MIN_FIRST;
    const start = Date.now();

    let reported = false;
    const device = /iPhone|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

    const report = (skipped = false) => {
      if (skipped && !reported) track("splash_skipped", { device });
      if (!reported) {
        const ms = Date.now() - start;
        track("splash_shown", { duration_ms: ms, copy_id: msg, device });
        reported = true;
      }
    };

    const done = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, min - elapsed);
      setTimeout(() => {
        setHide(true);
        onDone();
      }, wait);
      window.sessionStorage.setItem("jizai:splash-seen", "1");
      report(false);
    };

    if (fast) {
      setTimeout(() => {
        setHide(true);
        onDone();
      }, SPLASH_MIN_REPEAT);
      report(true);
      return;
    }

    const maxTimer = setTimeout(done, SPLASH_MAX);
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    return () => clearTimeout(maxTimer);
  }, [onDone, msg]);

  // Safe-area aware full screen; iOS Safari 100vh quirks mitigated via fixed + insets
  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed inset-0 z-50 grid place-items-center text-white transition-opacity duration-500 ${
        hide ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Background gradient with ultra subtle breathe (low saturation shift simulated by position) */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: `linear-gradient(135deg, ${splash.gradient[0]}, ${splash.gradient[1]})`,
          backgroundSize: "200% 200%",
          animation: "bg-breathe 8s ease-in-out infinite alternate",
        }}
      />

      {/* Glass panel */}
      <div
        className="relative flex flex-col items-center gap-5 p-6 sm:p-8 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{ backdropFilter: "blur(6px)", backgroundColor: splash.panelBg, borderRadius: splash.radius }}
      >
        {/* Slider motif */}
        <div className="relative w-[72vw] max-w-[560px] h-4 sm:h-5 rounded-full bg-white/90 overflow-hidden">
          <div
            className="absolute -top-3 left-1/2 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow"
            style={{ animation: "knob 1.6s ease-in-out infinite" }}
          />
        </div>
        <p className="text-base sm:text-lg font-semibold text-white drop-shadow text-center leading-snug">
          {msg}
        </p>
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important }
        }
        @keyframes knob {
          0%,100% { transform: translateX(-50%) }
          50%     { transform: translateX(calc(-50% + 5px)) }
        }
        @keyframes bg-breathe {
          0% { background-position: 0% 50% }
          100% { background-position: 100% 50% }
        }
      `}</style>
    </div>
  );
}

