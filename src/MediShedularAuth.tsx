import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Lock } from "lucide-react";
import GlassLayout from "./components/GlassLayout";

/** Demo staff credentials for MediSchedular */
export const MEDI_SHEDULAR_DEMO_ID = "staff_medi";
export const MEDI_SHEDULAR_DEMO_PASSWORD = "medished2026";

const inputClass =
  "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-cyan-50 placeholder:text-cyan-200/40 shadow-inner backdrop-blur-md transition focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950/80";

export default function MediShedularAuth() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => userId.trim().length > 0 && password.trim().length > 0,
    [userId, password]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const u = userId.trim();
    const p = password.trim();
    if (!u || !p) {
      setError("Enter staff user ID and password.");
      return;
    }
    if (u !== MEDI_SHEDULAR_DEMO_ID || p !== MEDI_SHEDULAR_DEMO_PASSWORD) {
      setError("Invalid credentials. Use the demo ID and password shown below.");
      return;
    }
    navigate("/medishedular/dashboard");
  }

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          to="/"
          className="mb-6 text-sm font-medium text-cyan-200/80 transition hover:text-white"
        >
          ← Back to home
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/20">
              <CalendarClock className="h-6 w-6 text-cyan-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MediSchedular</h1>
              <p className="text-sm text-cyan-100/70">Staff sign-in</p>
            </div>
          </div>

          <p className="mb-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
            <span className="font-semibold text-cyan-50">Demo: </span>
            User ID <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-cyan-200">
              {MEDI_SHEDULAR_DEMO_ID}
            </code>
            {" · "}
            Password{" "}
            <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-cyan-200">
              {MEDI_SHEDULAR_DEMO_PASSWORD}
            </code>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-cyan-100/80">
                Staff user ID
              </label>
              <input
                type="text"
                autoComplete="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className={inputClass}
                placeholder="Enter staff ID"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-cyan-100/80">
                <Lock className="h-3.5 w-3.5" />
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl border border-cyan-300/40 bg-cyan-500/25 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign in to panel
            </button>
          </form>
        </div>
      </div>
    </GlassLayout>
  );
}
