import React from "react";

type GlassLayoutProps = {
  children: React.ReactNode;
};

/**
 * Shared full-viewport glass background (matches Home).
 */
export default function GlassLayout({ children }: GlassLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-slate-950">
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
      <div className="relative z-10 min-h-[100dvh] w-full">{children}</div>
    </div>
  );
}
