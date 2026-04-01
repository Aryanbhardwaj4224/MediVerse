import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Home, Pill, UserRound } from "lucide-react";
import GlassLayout from "./components/GlassLayout";

const CYCLE_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "medishedular_state_v1";

type MedRowDef = {
  id: string;
  medicine: string;
  dosage: string;
  schedule: string; // "HH:MM" 24h local
};

const ROW_DEFS: MedRowDef[] = [
  { id: "r1", medicine: "Paracetamol", dosage: "500 mg", schedule: "08:00" },
  { id: "r2", medicine: "Amoxicillin", dosage: "250 mg", schedule: "12:00" },
  { id: "r3", medicine: "Furosemide", dosage: "40 mg", schedule: "14:00" },
  { id: "r4", medicine: "Metoprolol", dosage: "25 mg", schedule: "18:00" },
  { id: "r5", medicine: "Insulin (rapid)", dosage: "6 units", schedule: "20:00" },
];

type RowPersist = {
  checked: boolean;
  doseLoggedAt: string | null; // ISO
};

type PersistShape = {
  cycleStart: number;
  rows: Record<string, RowPersist>;
};

function loadPersist(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistShape;
  } catch {
    return null;
  }
}

function savePersist(p: PersistShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function scheduleDateToday(schedule: string): Date {
  const [h, m] = schedule.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** After this many ms past scheduled time without a log → show missed */
const MISSED_GRACE_MS = 60 * 60 * 1000;

function formatHms(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";

const PATIENT_PHOTO =
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=480&q=80";

export default function MediShedularDashboard() {
  const [tick, setTick] = useState(0);
  const [persist, setPersist] = useState<PersistShape>(() => {
    const loaded = loadPersist();
    if (loaded?.cycleStart && loaded.rows) {
      const elapsed = Date.now() - loaded.cycleStart;
      if (elapsed >= CYCLE_MS) {
        const fresh: PersistShape = {
          cycleStart: Date.now(),
          rows: Object.fromEntries(
            ROW_DEFS.map((r) => [r.id, { checked: false, doseLoggedAt: null }])
          ),
        };
        savePersist(fresh);
        return fresh;
      }
      return loaded;
    }
    const initial: PersistShape = {
      cycleStart: Date.now(),
      rows: Object.fromEntries(
        ROW_DEFS.map((r) => [r.id, { checked: false, doseLoggedAt: null }])
      ),
    };
    savePersist(initial);
    return initial;
  });

  const cycleStart = persist.cycleStart;
  const rows = persist.rows;

  const resetIfNeeded = useCallback(() => {
    setPersist((prev) => {
      if (Date.now() - prev.cycleStart < CYCLE_MS) return prev;
      const next: PersistShape = {
        cycleStart: Date.now(),
        rows: Object.fromEntries(
          ROW_DEFS.map((r) => [r.id, { checked: false, doseLoggedAt: null }])
        ),
      };
      savePersist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      resetIfNeeded();
    }, 1000);
    return () => window.clearInterval(id);
  }, [resetIfNeeded]);

  const timeUntilResetMs = useMemo(
    () => Math.max(0, cycleStart + CYCLE_MS - Date.now()),
    [cycleStart, tick]
  );

  const setRow = (id: string, patch: Partial<RowPersist>) => {
    setPersist((prev) => {
      const cur = prev.rows[id] ?? { checked: false, doseLoggedAt: null };
      const next: PersistShape = {
        ...prev,
        rows: { ...prev.rows, [id]: { ...cur, ...patch } },
      };
      savePersist(next);
      return next;
    });
  };

  const onCheck = (id: string) => {
    const r = rows[id];
    if (!r || r.checked) return;
    setRow(id, { checked: true });
  };

  const onDoseCell = (id: string) => {
    const r = rows[id];
    if (!r) return;
    if (r.doseLoggedAt) return;
    setRow(id, { doseLoggedAt: new Date().toISOString(), checked: true });
  };

  function col4Label(
    schedule: string,
    doseLoggedAt: string | null,
    now: Date
  ): { text: string; tone: "muted" | "ok" | "miss" } {
    const sched = scheduleDateToday(schedule);
    const missedAfter = new Date(sched.getTime() + MISSED_GRACE_MS);

    if (doseLoggedAt) {
      const t = new Date(doseLoggedAt);
      return {
        text: `Logged: ${t.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`,
        tone: "ok",
      };
    }

    if (now > missedAfter) {
      return { text: "Dosage missed", tone: "miss" };
    }

    return {
      text: "Tap to log dose time",
      tone: "muted",
    };
  }

  const now = new Date();

  return (
    <GlassLayout>
      <div className="min-h-[100dvh] px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            MediSchedular — Dose panel
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-400/40 hover:bg-white/15"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Patient ID card — left half */}
          <div className={`${glass} overflow-hidden p-0 lg:min-h-[420px]`}>
            <div className="flex h-full flex-col sm:flex-row">
              <div className="relative h-60 shrink-0 sm:h-auto sm:w-56 lg:w-64">
                <img
                  src={PATIENT_PHOTO}
                  alt="Patient"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-slate-950/40" />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 p-6">
                <div className="flex items-center gap-2 text-cyan-200/90">
                  <UserRound className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Patient
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">Arvi Sharma</p>
                <dl className="grid gap-1.5 text-sm">
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

          {/* Medicine grid — right half */}
          <div className={`${glass} p-4 sm:p-5 lg:min-h-[420px]`}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Pill className="h-4 w-4" />
              Today&apos;s schedule
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-cyan-200/70">
                    <th className="w-12 pr-2">Done</th>
                    <th className="pr-3">Medicine &amp; dosage</th>
                    <th className="pr-3">Schedule</th>
                    <th>Accountability</th>
                  </tr>
                </thead>
                <tbody>
                  {ROW_DEFS.map((def) => {
                    const st = rows[def.id] ?? {
                      checked: false,
                      doseLoggedAt: null,
                    };
                    const c4 = col4Label(def.schedule, st.doseLoggedAt, now);
                    const checkboxDisabled = st.checked;

                    return (
                      <tr key={def.id} className="align-middle">
                        <td className="pr-2 py-2">
                          <input
                            type="checkbox"
                            checked={st.checked}
                            disabled={checkboxDisabled}
                            onChange={() => onCheck(def.id)}
                            className="h-4 w-4 rounded border-cyan-400/50 bg-white/10 text-cyan-500 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                            title={
                              st.checked
                                ? "Locked until cycle reset (24h)"
                                : "Mark dose prep done"
                            }
                          />
                        </td>
                        <td className="pr-3 py-2 font-medium text-cyan-50">
                          {def.medicine}
                          <span className="block text-xs font-normal text-cyan-200/80">
                            {def.dosage}
                          </span>
                        </td>
                        <td className="pr-3 py-2 font-mono text-cyan-100">
                          {def.schedule}
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            disabled={!!st.doseLoggedAt || c4.tone === "miss"}
                            onClick={() => onDoseCell(def.id)}
                            className={`w-full rounded-lg border px-2 py-2 text-left text-xs transition sm:text-sm ${
                              c4.tone === "miss"
                                ? "cursor-default border-red-400/40 bg-red-500/15 font-semibold text-red-100"
                                : c4.tone === "ok"
                                  ? "cursor-default border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                                  : "border-cyan-400/30 bg-cyan-500/10 text-cyan-50 hover:border-cyan-300/50 hover:bg-cyan-500/20"
                            }`}
                          >
                            {c4.text}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full justify-end">
          <footer
            className={`${glass} inline-flex w-fit max-w-full flex-wrap items-center justify-end gap-2 px-5 py-4 text-right`}
          >
            <Clock className="h-5 w-5 shrink-0 text-cyan-300" />
            <span className="text-sm font-medium text-cyan-100">
              time until reset:{" "}
              <span className="font-mono text-white tabular-nums">
                {formatHms(timeUntilResetMs)}
              </span>
            </span>
            <span className="text-xs text-cyan-200/60">
              (checkboxes &amp; logs clear when timer reaches zero)
            </span>
          </footer>
        </div>
      </div>
    </GlassLayout>
  );
}
