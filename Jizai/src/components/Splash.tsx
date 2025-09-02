"use client";
import React, { useEffect, useMemo, useState } from "react";
import { track } from "../lib/analytics";

const SPLASH_MIN = 800;  // ms (first visit)
const SPLASH_MIN_REPEAT = 400; // ms (repeat)
const SPLASH_MAX = 1800; // ms (upper bound)

const messages = [
  "写真、思いのままに。",
  "背景をやさしく、無地に。",
  "四つ切・A4・L判で仕上げ。",
];

export default function Splash({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  const msg = useMemo(() => messages[Math.floor(Math.random() * messages.length)], []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fast = params.get("fast") === "true";
    const seen = window.sessionStorage.getItem("jizai:splash-seen");
    const min = fast ? SPLASH_MIN_REPEAT : seen ? SPLASH_MIN_REPEAT : SPLASH_MIN;
    const start = Date.now();

    let reported = false;
    const report = () => {
      if (!reported) {
        const duration = Date.now() - start;
        track("splash_duration_ms", { ms: duration, first: !seen });
        if (!seen) track("splash_shown", { message: msg });
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
      report();
    };

    const maxTimer = setTimeout(done, SPLASH_MAX);
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    return () => {
      clearTimeout(maxTimer);
    };
  }, [onDone, msg]);

  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed inset-0 z-50 grid place-items-center text-white transition-opacity duration-500 ${
        hide ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: "linear-gradient(135deg,#1E3A8A,#7C3AED)",
          backgroundSize: "200% 200%",
          animation: "bg-breathe 8s ease-in-out infinite alternate",
        }}
      />

      {/* Slider motif + copy card */}
      <div
        className="relative flex flex-col items-center gap-5 p-8 rounded-2xl"
        style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(17,17,20,0.45)" }}
      >
        <div className="relative w-[56vw] max-w-[560px] h-5 rounded-full bg-white/90 overflow-hidden">
          {/* knob */}
          <div
            className="absolute -top-3 left-1/2 h-11 w-11 rounded-full bg-white shadow"
            style={{ animation: "knob 1.6s ease-in-out infinite" }}
          />
        </div>
        <p className="text-lg sm:text-xl font-semibold text-white drop-shadow">{msg}</p>
      </div>

      {/* animations & accessibility */}
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
