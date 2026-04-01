import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Activity, Server, WifiOff } from "lucide-react";
import GlassLayout from "./components/GlassLayout";

type LiveData = {
  spo2: number | null;
  heart_rate: number | null;
  timestamp: number | null;
  risk: "CRITICAL" | "WARNING" | "NORMAL" | null;
  risk_score: number | null;
  reason: string | null;
  source?: {
    sensor_url?: string;
    last_fetch_ok?: boolean;
    last_error?: string | null;
    last_error_at?: number | null;
  };
};

type AlertItem = {
  timestamp: number;
  spo2: number;
  heart_rate: number;
  reason: string;
  risk_score: number;
};

const BACKEND_BASE = "http://localhost:5001";

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

export default function CentralSystem() {
  const token = useMemo(() => localStorage.getItem("mediverse_token"), []);
  const [live, setLive] = useState<LiveData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);
      const [liveRes, alertsRes] = await Promise.all([
        fetch(`${BACKEND_BASE}/live-data`),
        fetch(`${BACKEND_BASE}/alerts`),
      ]);

      if (!liveRes.ok) throw new Error(`live-data: ${liveRes.status}`);
      if (!alertsRes.ok) throw new Error(`alerts: ${alertsRes.status}`);

      const liveJson = (await liveRes.json()) as LiveData;
      const alertsJson = (await alertsRes.json()) as {
        alerts: AlertItem[];
      };

      setLive(liveJson);
      setAlerts(Array.isArray(alertsJson.alerts) ? alertsJson.alerts : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Backend not reachable (${BACKEND_BASE}) — ${msg}`);
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(id);
  }, []);

  const riskBadge =
    live?.risk === "CRITICAL"
      ? "border-red-400/40 bg-red-500/15 text-red-100"
      : live?.risk === "WARNING"
        ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
        : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/tab3"
            className="text-sm font-medium text-cyan-200/90 transition hover:text-white"
          >
            ← Back to Clinical Access
          </Link>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-cyan-300/80" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
              Main System (Laptop 2)
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl">
          <div className={`${glass} p-5 sm:p-6`}>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Smart Hospital Central System
            </h1>
            <p className="mt-2 text-sm text-cyan-100/70">
              Live IoT feed is polled from the Sensor Server and analyzed here.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-cyan-100/70">
                Token:{" "}
                <span className="font-mono text-cyan-100/90">
                  {token ? "stored" : "missing"}
                </span>
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-cyan-100/70">
                Backend:{" "}
                <span className="font-mono text-cyan-100/90">
                  {BACKEND_BASE}
                </span>
              </span>
              {live?.source?.sensor_url && (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-cyan-100/70">
                  Sensor URL:{" "}
                  <span className="font-mono text-cyan-100/90">
                    {live.source.sensor_url}
                  </span>
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/35 bg-red-500/10 p-4 text-sm text-red-100">
              <div className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-5 w-5 text-red-200" />
                <div>
                  <p className="font-semibold">Connection error</p>
                  <p className="mt-1 text-red-100/90">{error}</p>
                  <p className="mt-2 text-xs text-red-200/70">
                    Start the backend: <span className="font-mono">python main_backend.py</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Live vitals */}
            <section className={`${glass} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Live vitals + risk
                  </h2>
                  <p className="mt-1 text-sm text-cyan-100/70">
                    Updated every 1 second
                  </p>
                </div>
                <Activity className="h-5 w-5 text-cyan-300/80" aria-hidden />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">
                    SpO₂
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {live?.spo2 ?? "—"}
                    <span className="ml-1 text-sm font-semibold text-cyan-100/70">
                      %
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">
                    Heart rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {live?.heart_rate ?? "—"}
                    <span className="ml-1 text-sm font-semibold text-cyan-100/70">
                      bpm
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadge}`}
                >
                  {live?.risk ?? "UNKNOWN"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-cyan-100/70">
                  Score:{" "}
                  <span className="font-mono text-cyan-100/90">
                    {live?.risk_score ?? "—"}
                  </span>
                </span>
              </div>

              <p className="mt-3 text-sm text-cyan-50/85">
                <span className="text-cyan-200/70">Reason: </span>
                {live?.reason ?? "—"}
              </p>
              <p className="mt-2 text-xs text-cyan-100/55">
                Timestamp:{" "}
                <span className="font-mono">{live?.timestamp ?? "—"}</span>
              </p>
            </section>

            {/* Alerts */}
            <section className={`${glass} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Recent critical alerts
                  </h2>
                  <p className="mt-1 text-sm text-cyan-100/70">
                    Stored in-memory (last 50)
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-300/90" aria-hidden />
              </div>

              <div className="scrollbar-modern mt-4 max-h-[22rem] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-cyan-200/60">
                    No critical alerts yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {alerts
                      .slice()
                      .reverse()
                      .map((a) => (
                        <li
                          key={`${a.timestamp}-${a.spo2}-${a.heart_rate}`}
                          className="rounded-xl border border-red-400/20 bg-red-500/10 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-100/90">
                              CRITICAL
                            </span>
                            <span className="font-mono text-[11px] text-cyan-100/60">
                              ts {a.timestamp}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-cyan-50/90">
                            SpO₂ {a.spo2}% · HR {a.heart_rate} bpm
                          </p>
                          <p className="mt-1 text-xs text-red-100/80">
                            {a.reason}
                          </p>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}

