import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Clock3,
  HeartPulse,
  RefreshCcw,
  Thermometer,
  WifiOff,
} from "lucide-react";
import GlassLayout from "./components/GlassLayout";

type SensorPayload = {
  spo2: number;
  heart_rate: number;
  bp_sys: number;
  bp_dia: number;
  resp_rate: number;
  temperature: number;
  glucose: number;
  map: number;
  cardiac_output: number;
  cardiac_index: number;
  cvp: number;
  timestamp: string;
};

// Use Vite dev proxy to avoid browser CORS blocks.
const SENSOR_URL = "/sensor-data";

export default function TransferLiveForm() {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSensorData() {
    try {
      const res = await fetch(SENSOR_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SensorPayload;
      setData(json);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(
        `Cannot reach Sensor Server (via Vite proxy to 10.50.175.221:5000) — ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchSensorData();
    const id = window.setInterval(() => void fetchSensorData(), 1000);
    return () => window.clearInterval(id);
  }, []);

  const inputClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-cyan-50 shadow-inner backdrop-blur-md";

  const metricRows: Array<{
    label: string;
    key: keyof SensorPayload;
    format?: (v: SensorPayload[keyof SensorPayload]) => string;
  }> = [
    { label: "SpO2", key: "spo2", format: (v) => `${v as number} %` },
    {
      label: "Heart Rate",
      key: "heart_rate",
      format: (v) => `${v as number} bpm`,
    },
    {
      label: "Blood Pressure (Sys)",
      key: "bp_sys",
      format: (v) => `${v as number} mmHg`,
    },
    {
      label: "Blood Pressure (Dia)",
      key: "bp_dia",
      format: (v) => `${v as number} mmHg`,
    },
    {
      label: "Respiratory Rate",
      key: "resp_rate",
      format: (v) => `${v as number} /min`,
    },
    {
      label: "Temperature",
      key: "temperature",
      format: (v) => `${v as number} °C`,
    },
    {
      label: "Glucose",
      key: "glucose",
      format: (v) => `${v as number} mg/dL`,
    },
    { label: "MAP", key: "map", format: (v) => `${v as number} mmHg` },
    {
      label: "Cardiac Output",
      key: "cardiac_output",
      format: (v) => `${v as number} L/min`,
    },
    {
      label: "Cardiac Index",
      key: "cardiac_index",
      format: (v) => `${v as number} L/min/m²`,
    },
    { label: "CVP", key: "cvp", format: (v) => `${v as number} mmHg` },
  ];

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/tab3"
              className="text-sm font-medium text-cyan-200/80 transition hover:text-white"
            >
              ← Back to Clinical Access
            </Link>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-cyan-200/80">
              <Activity className="h-4 w-4" />
              Live Sensor Form
            </div>
          </div>

          <h1 className="mb-2 text-xl font-semibold text-white">
            Patient Transfer — Sensor Feed
          </h1>
          <p className="mb-6 text-sm text-cyan-100/75">
            These fields are auto-filled from the Sensor Server every second.
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-100">
              <div className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {metricRows.map((m, idx) => (
              <div key={m.label}>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-cyan-100/80">
                  {idx % 3 === 0 ? (
                    <Activity className="h-3.5 w-3.5" />
                  ) : idx % 3 === 1 ? (
                    <HeartPulse className="h-3.5 w-3.5" />
                  ) : (
                    <Thermometer className="h-3.5 w-3.5" />
                  )}
                  {m.label}
                </label>
                <input
                  readOnly
                  value={
                    data
                      ? m.format
                        ? m.format(data[m.key])
                        : String(data[m.key])
                      : loading
                        ? "Fetching..."
                        : "—"
                  }
                  className={inputClass}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-cyan-100/80">
                <Clock3 className="h-3.5 w-3.5" />
                Timestamp (UTC)
              </label>
              <input
                readOnly
                value={data?.timestamp ?? (loading ? "Fetching..." : "—")}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchSensorData()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-500/30"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh now
          </button>
        </div>
      </div>
    </GlassLayout>
  );
}

