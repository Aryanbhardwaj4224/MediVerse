import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  HeartPulse,
  Home,
  Thermometer,
  UserRound,
  WifiOff,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import GlassLayout from "./components/GlassLayout";
import type { SensorPayload } from "./TransferLiveForm";

const SENSOR_URL = "/sensor-data";

/**
 * ECG waveform clip — bundled from your Google Drive
 * (ECG_Waves_for_Dashboard.mp4 → public/videos/ecg-waves-dashboard.mp4).
 * Original: https://drive.google.com/file/d/1baoEdnQc8GSnX63hMQ6A09NQ9Ar0puL7/view
 */
const ECG_VIDEO_SRC = `${import.meta.env.BASE_URL}videos/ecg-waves-dashboard.mp4`.replace(
  /([^:]\/)\/+/g,
  "$1"
);

/** Proxy in vite.config.ts → Flask Smart Hospital Map (run hospital_map_app.py on :8000). */
const HOSPITAL_MAP_IFRAME_SRC =
  import.meta.env.VITE_HOSPITAL_MAP_URL ?? "/hospital-map/";

/** From Drive audio.mp3 → public/audio/panic-alert.mp3 */
const PANIC_AUDIO_SRC = `${import.meta.env.BASE_URL}audio/panic-alert.mp3`.replace(
  /([^:]\/)\/+/g,
  "$1"
);

const EMAILJS_SERVICE_ID = "service_zapmcrs";
const EMAILJS_TEMPLATE_ID = "template_8vtyqdg";
const EMAILJS_PUBLIC_KEY = "FPwtwFLpMtDmVwTTH";

/**
 * Sends panic notification via EmailJS. Ensure template fields exist in
 * EmailJS (e.g. message, time, dashboard) or rename keys to match your template.
 */
export async function sendAlertEmail(): Promise<void> {
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      message: "Emergency panic activated on VitalWeave Nexus.",
      time: new Date().toLocaleString(),
      dashboard: "VitalWeave Nexus",
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

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

function IconFor({ kind }: { kind: MetricCell["icon"] }) {
  if (kind === "heart") return <HeartPulse className="h-3.5 w-3.5" />;
  if (kind === "thermo") return <Thermometer className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

export default function VitalWeaveNexus() {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panicModalOpen, setPanicModalOpen] = useState(false);
  /** Height of 9-sensor block + ECG (used to size hospital map row) */
  const [sensorEcgStackPx, setSensorEcgStackPx] = useState(0);
  const sensorEcgStackRef = useRef<HTMLDivElement>(null);
  const panicAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopPanicAudio = useCallback(() => {
    const a = panicAudioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.loop = false;
    }
  }, []);

  const openPanicModal = useCallback(() => {
    stopPanicAudio();
    setPanicModalOpen(true);
    void sendAlertEmail().catch((err) => {
      console.error("EmailJS panic alert failed:", err);
    });
    queueMicrotask(() => {
      const el = panicAudioRef.current;
      if (!el) return;
      el.currentTime = 0;
      el.loop = true;
      el.volume = 1;
      void el.play().catch((err) => {
        console.warn("Panic audio play failed:", err);
      });
    });
  }, [stopPanicAudio]);

  const closePanicModal = useCallback(() => {
    stopPanicAudio();
    setPanicModalOpen(false);
  }, [stopPanicAudio]);

  const sendPanicAlert = useCallback(() => {
    void sendAlertEmail().catch((err) => {
      console.error("EmailJS resend failed:", err);
    });
  }, []);

  useEffect(() => {
    return () => stopPanicAudio();
  }, [stopPanicAudio]);

  useEffect(() => {
    if (!panicModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panicModalOpen]);

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

  useLayoutEffect(() => {
    const el = sensorEcgStackRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setSensorEcgStackPx(Math.round(h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <GlassLayout>
      <audio
        ref={panicAudioRef}
        src={PANIC_AUDIO_SRC}
        preload="auto"
        playsInline
        className="pointer-events-none fixed left-0 top-0 h-0 w-0 opacity-0"
        aria-hidden
      />
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

        {/* Upper half — patient card | (sensors + thin ECG strip same width as sensors) */}
        <section className="mb-8 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              <span className="inline-flex items-center gap-2">
                <WifiOff className="h-3.5 w-3.5 shrink-0" />
                {error}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr] lg:items-stretch lg:gap-x-6">
            {/* Patient ID card */}
            <div
              className={`${glass} order-1 flex min-h-[220px] overflow-hidden p-0 lg:min-h-0 lg:h-full`}
            >
              <div className="flex h-full min-h-0 w-full flex-1 flex-col sm:flex-row">
                <div className="relative h-48 min-h-[12rem] w-full shrink-0 sm:h-full sm:min-h-0 sm:w-48">
                  <img
                    src={PATIENT_PHOTO}
                    alt="Patient"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-slate-950/40" />
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 p-5">
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

            {/* Sensors + ECG — measured height drives hospital map row below */}
            <div
              ref={sensorEcgStackRef}
              className="order-2 flex min-h-0 w-full min-w-0 flex-col gap-3"
            >
              <div className="grid min-h-[220px] grid-cols-3 grid-rows-3 gap-2 sm:gap-3">
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
                      className="flex min-h-0 flex-col justify-center rounded-xl border border-cyan-400/25 bg-slate-950/40 px-2 py-2 backdrop-blur-sm sm:px-3 sm:py-2.5"
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
                className={`${glass} relative w-full overflow-hidden rounded-xl border border-cyan-400/20 p-0`}
              >
                <div className="relative max-h-[min(35vh,260px)] min-h-[7rem] h-36 w-full overflow-hidden bg-slate-950 sm:h-44 md:h-52">
                  <video
                    className="h-full w-full object-contain object-center"
                    src={ECG_VIDEO_SRC}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    aria-label="ECG waveform video display"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-200/95 sm:text-[10px]">
                      ECG · display only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lower half — same grid widths as upper row; map height = sensors + ECG stack */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,340px)_1fr] lg:items-stretch lg:gap-x-6">
          <div
            className="flex min-h-[8rem] items-center justify-center"
            style={
              sensorEcgStackPx > 0
                ? { minHeight: sensorEcgStackPx, height: sensorEcgStackPx }
                : undefined
            }
          >
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={openPanicModal}
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-red-400/70 bg-gradient-to-b from-red-600/95 to-red-900 text-center text-[11px] font-bold uppercase leading-tight tracking-[0.18em] text-white shadow-[0_0_36px_rgba(239,68,68,0.55)] transition hover:border-red-300 hover:shadow-[0_0_52px_rgba(248,113,113,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-32 sm:w-32 sm:text-xs"
              >
                Panic
              </button>
            </div>
          </div>

          <div
            className={`${glass} flex min-h-[200px] min-w-0 flex-col overflow-hidden p-2 sm:p-3 ${
              sensorEcgStackPx > 0 ? "lg:max-h-none" : ""
            }`}
            style={
              sensorEcgStackPx > 0
                ? { height: sensorEcgStackPx, minHeight: sensorEcgStackPx }
                : { minHeight: "min(40vh, 320px)" }
            }
          >
            <p className="mb-1 shrink-0 px-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/85 sm:text-xs">
              Smart Hospital Map — run{" "}
              <code className="text-cyan-100/90">python hospital_map_app.py</code>{" "}
              (port 8000)
            </p>
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg bg-[#2d2d2d]">
              <iframe
                title="Smart Hospital Map"
                src={HOSPITAL_MAP_IFRAME_SRC}
                className="h-full w-full min-h-[260px] border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        </section>
        {panicModalOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-red-600/45 p-4 backdrop-blur-md"
            role="presentation"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-red-400/40 bg-slate-950/95 p-6 text-center shadow-[0_0_60px_rgba(220,38,38,0.45)] backdrop-blur-xl"
              role="dialog"
              aria-labelledby="panic-dialog-title"
            >
              <h2
                id="panic-dialog-title"
                className="text-lg font-bold uppercase tracking-wide text-red-200"
              >
                Emergency panic
              </h2>
              <p className="mt-2 text-sm text-cyan-100/80">
                Alert email was sent. Audio is playing. Only{" "}
                <strong>Stop</strong> silences sound and closes this dialog.
                <strong> Send alert</strong> sends another email.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={sendPanicAlert}
                  className="rounded-xl border border-amber-400/50 bg-amber-600/25 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-600/35"
                >
                  Send alert
                </button>
                <button
                  type="button"
                  onClick={closePanicModal}
                  className="rounded-xl border border-red-400/60 bg-red-700/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700/55"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassLayout>
  );
}
