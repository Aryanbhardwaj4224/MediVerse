import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

/**
 * Mediverse — landing hero with glassmorphism, cyan/white theme, and emergency CTA.
 * Requires: react, lucide-react, tailwindcss (with backdrop-blur support).
 */
export default function Home() {
  return (
    <div className="relative flex h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-slate-950">
      {/* Background image + readability overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2400&q=80)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/90 via-cyan-950/55 to-cyan-600/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,211,238,0.12),_transparent_55%)]"
        aria-hidden
      />

      {/* Brand + top navigation */}
      <header className="relative z-20 flex w-full items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-md sm:px-4 sm:py-2.5">
          <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-sm font-bold tracking-tight text-transparent sm:text-base">
            MediVerse
          </span>
        </div>
        <nav
          className="flex w-fit max-w-[min(100%,42rem)] shrink-0 items-center rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 sm:px-6"
          aria-label="Primary"
        >
          <ul className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {["Tab 1", "Tab 2", "Tab 3", "Tab 4"].map((label) => (
              <li key={label}>
                {label === "Tab 3" ? (
                  <Link
                    to="/tab3"
                    className="group relative block rounded-xl px-3 py-2 text-sm font-medium text-cyan-50/90 transition-colors duration-200 hover:text-white sm:px-4"
                  >
                    <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" />
                    <span className="relative">{label}</span>
                  </Link>
                ) : (
                  <a
                    href="#"
                    className="group relative block rounded-xl px-3 py-2 text-sm font-medium text-cyan-50/90 transition-colors duration-200 hover:text-white sm:px-4"
                  >
                    <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]" />
                    <span className="relative">{label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Middle-left hero */}
      <main className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-36 sm:px-8 sm:pb-40 lg:px-16 lg:pb-44">
        <div className="max-w-3xl">
          <h1 className="bg-gradient-to-br from-cyan-300 via-cyan-100 to-white bg-clip-text text-5xl font-black leading-[1.05] tracking-tight text-transparent drop-shadow-sm sm:text-6xl md:text-7xl lg:text-8xl">
            MediVerse
          </h1>
          <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-cyan-50/85 sm:text-lg md:text-xl">
            Pioneering the future of digital health.
          </p>
        </div>
      </main>

      {/* Emergency — wide spacebar-style CTA */}
      <div className="pointer-events-none absolute bottom-20 left-4 z-20 w-[min(92vw,42rem)] sm:bottom-24 sm:left-6 lg:left-10">
        <Link
          to="/emergency"
          className="pointer-events-auto relative flex w-full overflow-hidden rounded-2xl border border-red-400/40 bg-gradient-to-r from-red-500/35 via-rose-500/30 to-red-600/35 px-6 py-4 text-center text-lg font-bold uppercase tracking-[0.2em] text-red-50 shadow-[0_0_40px_rgba(248,113,113,0.35)] backdrop-blur-xl transition hover:border-red-300/60 hover:shadow-[0_0_56px_rgba(248,113,113,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:rounded-3xl sm:py-5 sm:text-xl"
        >
          <span
            className="absolute inset-0 animate-pulse bg-gradient-to-r from-red-500/20 via-transparent to-cyan-400/10"
            aria-hidden
          />
          <span className="relative flex w-full items-center justify-center gap-2">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-300 shadow-[0_0_12px_#fca5a5]" />
            Emergency
          </span>
        </Link>
      </div>

      {/* Floating chatbot */}
      <button
        type="button"
        aria-label="Open support chat"
        className="fixed bottom-6 right-4 z-30 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/35 bg-white/15 text-cyan-50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:scale-105 hover:border-cyan-200/50 hover:bg-white/25 hover:shadow-[0_12px_40px_rgba(34,211,238,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:bottom-8 sm:right-8 sm:h-24 sm:w-24"
      >
        <MessageCircle className="h-11 w-11 sm:h-14 sm:w-14" strokeWidth={2} />
      </button>
    </div>
  );
}
