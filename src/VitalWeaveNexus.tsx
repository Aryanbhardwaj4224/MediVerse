import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  HeartPulse,
  Home,
  Thermometer,
  UserRound,
  WifiOff,
} from "lucide-react";
import GlassLayout from "./components/GlassLayout";
import type { SensorPayload } from "./TransferLiveForm";

const SENSOR_URL = "/sensor-data";

/** Mixkit — hospital heart-rate monitor (720p direct asset; preview URL may 403). */
const ECG_VIDEO_SRC =
  "https://assets.mixkit.co/videos/4783/4783-720.mp4";

const PATIENT_PHOTO =
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=480&q=80";

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

type MetricCell = {
  label: string;
  key: keyof SensorPayload;
  format: (v: number | string | undefined) => string;
  icon: "activity" | "heart" | "thermo";
};

const NINE_METRICS: MetricCell[] = [
  {
    label: "SpO₂",
    key: "spo2",
    format: (v) => (typeof v === "number" ? `${v} %` : "—"),
    icon: "activity",
  },
  {
    label: "Heart rate",
    key: "heart_rate",
    format: (v) => (typeof v === "number" ? `${v} bpm` : "—"),
    icon: "heart",
  },
  {
    label: "BP (Sys)",
    key: "bp_sys",
    format: (v) => (typeof v === "number" ? `${v} mmHg` : "—"),
    icon: "activity",
  },
  {
    label: "BP (Dia)",
    key: "bp_dia",
    format: (v) => (typeof v === "number" ? `${v} mmHg` : "—"),
    icon: "activity",
  },
  {
    label: "Resp. rate",
    key: "resp_rate",
    format: (v) => (typeof v === "number" ? `${v} /min` : "—"),
    icon: "thermo",
  },
  {
    label: "Temperature",
    key: "temperature",
    format: (v) => (typeof v === "number" ? `${v} °C` : "—"),
    icon: "thermo",
  },
  {
    label: "Glucose",
    key: "glucose",
    format: (v) => (typeof v === "number" ? `${v} mg/dL` : "—"),
    icon: "activity",
  },
  {
    label: "MAP",
    key: "map",
    format: (v) => (typeof v === "number" ? `${v} mmHg` : "—"),
    icon: "heart",
  },
  {
    label: "Cardiac output",
    key: "cardiac_output",
    format: (v) => (typeof v === "number" ? `${v} L/min` : "—"),
    icon: "heart",
  },
];

/** Graph for wayfinding (undirected). Shortest path Entrance → Trauma Bay. */
const HALL_NODES: { id: string; label: string; x: number; y: number }[] = [
  { id: "n0", label: "Entrance", x: 8, y: 82 },
  { id: "n1", label: "North ward", x: 28, y: 38 },
  { id: "n2", label: "ICU corridor", x: 28, y: 82 },
  { id: "n3", label: "Core lab", x: 52, y: 60 },
  { id: "n4", label: "Radiology", x: 76, y: 38 },
  { id: "n5", label: "Trauma bay", x: 92, y: 82 },
];

const HALL_EDGES: { a: number; b: number; w: number }[] = [
  { a: 0, b: 1, w: 3 },
  { a: 0, b: 2, w: 4 },
  { a: 1, b: 3, w: 2 },
  { a: 2, b: 3, w: 3 },
  { a: 3, b: 4, w: 2 },
  { a: 4, b: 5, w: 2 },
  { a: 2, b: 5, w: 6 },
];

function dijkstraPath(
  n: number,
  edges: { a: number; b: number; w: number }[],
  start: number,
  goal: number
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.a].push([e.b, e.w]);
    adj[e.b].push([e.a, e.w]);
  }
  const dist = new Array(n).fill(Infinity);
  const prev = new Array<number | null>(n).fill(null);
  dist[start] = 0;
  const seen = new Set<number>();
  while (seen.size < n) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!seen.has(i) && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u < 0 || dist[u] === Infinity) break;
    seen.add(u);
    for (const [v, w] of adj[u]) {
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
      }
    }
  }
  if (dist[goal] === Infinity) return [];
  const path: number[] = [];
  for (let cur: number | null = goal; cur !== null; cur = prev[cur]) {
    path.push(cur);
  }
  path.reverse();
  return path;
}

function IconFor({ kind }: { kind: MetricCell["icon"] }) {
  if (kind === "heart") return <HeartPulse className="h-3.5 w-3.5" />;
  if (kind === "thermo") return <Thermometer className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

export default function VitalWeaveNexus() {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panicSent, setPanicSent] = useState(false);

  const fetchSensorData = useCallback(async () => {
    try {
      const res = await fetch(SENSOR_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Partial<SensorPayload>;
      setData((prev) => ({ ...prev, ...json } as SensorPayload));
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Sensor feed unavailable — ${msg}`);
    }
  }, []);

  useEffect(() => {
    void fetchSensorData();
    const id = window.setInterval(() => void fetchSensorData(), 1000);
    return () => window.clearInterval(id);
  }, [fetchSensorData]);

  const shortestPath = useMemo(
    () => dijkstraPath(HALL_NODES.length, HALL_EDGES, 0, 5),
    []
  );

  const pathEdgeKeys = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const a = shortestPath[i];
      const b = shortestPath[i + 1];
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      s.add(k);
    }
    return s;
  }, [shortestPath]);

  function edgeKey(a: number, b: number) {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
  }

  return (
    <GlassLayout>
      <div className="min-h-[100dvh] px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            VitalWeave Nexus
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-400/40 hover:bg-white/15"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </header>

        {/* Upper half */}
        <section className="mb-8 grid min-h-[48vh] gap-6 lg:grid-cols-[minmax(260px,340px)_1fr] lg:items-stretch">
          {/* Patient ID card — same pattern as MediSchedular dashboard */}
          <div className={`${glass} overflow-hidden p-0`}>
            <div className="flex h-full flex-col sm:flex-row">
              <div className="relative h-52 shrink-0 sm:h-auto sm:w-48">
                <img
                  src={PATIENT_PHOTO}
                  alt="Patient"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-slate-950/40" />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 p-5">
                <div className="flex items-center gap-2 text-cyan-200/90">
                  <UserRound className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Patient
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">Arvi Sharma</p>
                <dl className="grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-cyan-200/70">Gender</dt>
                    <dd className="text-cyan-50">Female</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-cyan-200/70">Age</dt>
                    <dd className="text-cyan-50">54</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-cyan-200/70 shrink-0">Diagnose with</dt>
                    <dd className="text-cyan-50">Type 2 diabetes with pneumonia</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-cyan-200/70 shrink-0">Doctor assign</dt>
                    <dd className="text-cyan-50">Dr. Rohan Mehta</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <span className="inline-flex items-center gap-2">
                  <WifiOff className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {NINE_METRICS.map((m) => {
                const raw = data?.[m.key];
                const val =
                  typeof raw === "number"
                    ? m.format(raw)
                    : data
                      ? "—"
                      : "…";
                return (
                  <div
                    key={m.key}
                    className="rounded-xl border border-cyan-400/25 bg-slate-950/40 px-2 py-2.5 backdrop-blur-sm sm:px-3 sm:py-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/75 sm:text-xs">
                      <IconFor kind={m.icon} />
                      <span className="truncate">{m.label}</span>
                    </div>
                    <p className="font-mono text-sm font-semibold tabular-nums text-white sm:text-base">
                      {val}
                    </p>
                  </div>
                );
              })}
            </div>

            <div
              className={`${glass} relative flex-1 overflow-hidden p-0`}
              style={{ minHeight: "min(28vh, 220px)" }}
            >
              <video
                className="h-full w-full object-cover"
                src={ECG_VIDEO_SRC}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                aria-label="ECG waveform monitor display"
              />
              <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-200">
                ECG · display only
              </div>
            </div>
          </div>
        </section>

        {/* Lower half */}
        <section className="grid min-h-[36vh] gap-6 lg:grid-cols-[220px_1fr] lg:items-stretch">
          <div className="flex flex-col justify-end gap-3 lg:justify-center">
            <button
              type="button"
              onClick={() => {
                setPanicSent(true);
                window.setTimeout(() => setPanicSent(false), 4000);
              }}
              className="w-full rounded-2xl border-2 border-red-400/60 bg-gradient-to-b from-red-600/90 to-red-800/95 py-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_32px_rgba(239,68,68,0.45)] transition hover:border-red-300 hover:shadow-[0_0_48px_rgba(248,113,113,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Panic
            </button>
            {panicSent && (
              <p
                className="text-center text-xs font-medium text-red-200"
                role="status"
              >
                Alert simulated — support notified.
              </p>
            )}
          </div>

          <div className={`${glass} relative min-h-[280px] overflow-hidden p-4`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/80">
              Hospital routing — shortest path highlighted
            </p>
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full rounded-xl bg-slate-950/60"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Floor plan with shortest route to trauma bay in red"
            >
              <defs>
                <pattern
                  id="tile"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6"
                    stroke="rgba(34,211,238,0.06)"
                    strokeWidth="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#tile)" />
              {/* corridors (neutral) */}
              {HALL_EDGES.map((e) => {
                const A = HALL_NODES[e.a];
                const B = HALL_NODES[e.b];
                const onShortest = pathEdgeKeys.has(edgeKey(e.a, e.b));
                return (
                  <line
                    key={`${e.a}-${e.b}`}
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke={onShortest ? "rgba(248,113,113,0.95)" : "rgba(148,163,184,0.35)"}
                    strokeWidth={onShortest ? 2.2 : 0.9}
                    strokeLinecap="round"
                  />
                );
              })}
              {HALL_NODES.map((node, i) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={shortestPath.includes(i) ? 3.2 : 2.4}
                    fill={
                      shortestPath.includes(i)
                        ? "rgba(248,113,113,0.95)"
                        : "rgba(34,211,238,0.85)"
                    }
                    stroke="rgba(15,23,42,0.9)"
                    strokeWidth="0.4"
                  />
                  <text
                    x={node.x}
                    y={node.y - 5}
                    textAnchor="middle"
                    className="fill-[rgba(226,232,240,0.9)]"
                    style={{ fontSize: "3.2px" }}
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>
      </div>
    </GlassLayout>
  );
}
