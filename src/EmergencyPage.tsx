import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassLayout from "./components/GlassLayout";

/** Mixkit — close-up portrait (face to camera); scan effect is layered in UI. Free license: mixkit.co/license */
const FACE_SCAN_VIDEO =
  "https://assets.mixkit.co/videos/4535/4535-720.mp4";
const FACE_SCAN_POSTER =
  "https://assets.mixkit.co/videos/4535/4535-thumb-720-0.jpg";

const CHECKLIST_ITEMS = [
  "Prepare emergency trauma bay",
  "Ensure ventilator availability",
  "Notify surgical team",
  "Check blood supply stock",
  "Ready dynamic imaging (CT / X-ray)",
  "Activate on-call radiology",
  "Confirm isolation protocols if infectious concern",
];

const glassPanel =
  "rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 sm:p-8";

const checkboxClass =
  "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-cyan-300/50 bg-white/10 text-cyan-400 accent-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950";

export default function EmergencyPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [scanActive, setScanActive] = useState(false);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [videoOk, setVideoOk] = useState(true);

  const allChecklistComplete = useMemo(
    () =>
      CHECKLIST_ITEMS.every((_, index) => checked[index] === true),
    [checked]
  );

  const canAcknowledgeContinue = useMemo(
    () => allChecklistComplete && identityConfirmed,
    [allChecklistComplete, identityConfirmed]
  );

  function toggleItem(index: number) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleAcknowledgeContinue() {
    if (!canAcknowledgeContinue) return;
    navigate("/");
  }

  function handleSimulateScan() {
    if (identityConfirmed) return;
    setScanActive(true);
    window.setTimeout(() => {
      setScanActive(false);
      setIdentityConfirmed(true);
    }, 2800);
  }

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-cyan-200/90 transition hover:text-white"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-red-400 shadow-[0_0_12px_#f87171]"
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200/90">
              Emergency protocol
            </span>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center pb-8">
          <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Emergency readiness
          </h1>

          <div
            className={`${glassPanel} grid gap-8 lg:grid-cols-2 lg:gap-10`}
          >
            {/* WHO checklist */}
            <section className="flex flex-col">
              <h2 className="mb-6 text-lg font-semibold leading-snug text-cyan-300 sm:text-xl">
                WHO Guide: Pre-arrival Preparations
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-cyan-50/75">
                Run through this checklist before the patient arrives. Tick each
                item as it is confirmed.
              </p>
              <ul className="flex flex-col gap-3.5">
                {CHECKLIST_ITEMS.map((item, index) => (
                  <li key={item}>
                    <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-white/10 hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={!!checked[index]}
                        onChange={() => toggleItem(index)}
                        className={checkboxClass}
                      />
                      <span className="text-sm leading-relaxed text-cyan-50/95 group-hover:text-white">
                        {item}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleAcknowledgeContinue}
                disabled={!canAcknowledgeContinue}
                aria-disabled={!canAcknowledgeContinue}
                title={
                  canAcknowledgeContinue
                    ? undefined
                    : !allChecklistComplete
                      ? "Tick every checklist item"
                      : "Complete the face scan until Identity confirm appears"
                }
                className="mt-8 w-full rounded-2xl border border-white/25 bg-white/15 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 enabled:hover:border-cyan-300/50 enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-cyan-100/40"
              >
                Acknowledge &amp; Continue
              </button>
              {!canAcknowledgeContinue && (
                <p className="mt-2 text-center text-xs text-cyan-200/50">
                  {!allChecklistComplete && (
                    <>
                      Tick every checklist item.
                      <br />
                    </>
                  )}
                  {!identityConfirmed && (
                    <>
                      Complete the face scan on the right until the button shows{" "}
                      <span className="text-cyan-100/80">Identity confirm</span>.
                    </>
                  )}
                </p>
              )}
            </section>

            {/* Face verification simulation */}
            <section className="flex flex-col">
              <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
                Doctor Face Verification
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-cyan-50/75">
                Simulation only — dummy feed shows a close-up face; scan lines and
                HUD are overlaid for effect. A real system would verify against a
                secure hospital identity service.
              </p>

              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-black/50 shadow-[0_0_40px_rgba(34,211,238,0.2),inset_0_0_60px_rgba(34,211,238,0.08)]">
                <div className="pointer-events-none absolute inset-0 z-10 ring-2 ring-inset ring-cyan-300/20" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[length:100%_4px] opacity-40" />
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  <div className="animate-emergency-scan absolute left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" />
                </div>
                <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                  Live feed · encrypted
                </div>
                {videoOk ? (
                  <video
                    className="aspect-video w-full object-cover object-[center_15%]"
                    src={FACE_SCAN_VIDEO}
                    poster={FACE_SCAN_POSTER}
                    autoPlay
                    loop
                    muted
                    playsInline
                    referrerPolicy="no-referrer"
                    aria-label="Simulated live face scan feed"
                    onError={() => setVideoOk(false)}
                  />
                ) : (
                  <div
                    className="flex aspect-video w-full items-center justify-center bg-slate-900/90 bg-cover bg-center p-6 text-center text-sm text-cyan-100/80"
                    style={{ backgroundImage: `url(${FACE_SCAN_POSTER})` }}
                  >
                    <div className="rounded-xl border border-cyan-400/30 bg-slate-950/80 px-4 py-3 backdrop-blur-sm">
                      Video preview unavailable — placeholder scanner view.
                    </div>
                  </div>
                )}
                {scanActive && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cyan-500/10 backdrop-blur-[1px]">
                    <span className="rounded-full border border-cyan-300/50 bg-slate-950/70 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan-200">
                      Scanning…
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={scanActive || identityConfirmed}
                className={`mt-6 w-full rounded-2xl border px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.15em] backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-default ${
                  identityConfirmed
                    ? "border-emerald-300/50 bg-gradient-to-r from-emerald-400/35 to-teal-400/30 text-emerald-50 shadow-[0_0_28px_rgba(52,211,153,0.35)] focus-visible:ring-emerald-400/60"
                    : "border-cyan-300/40 bg-gradient-to-r from-cyan-500/35 to-sky-500/30 text-white shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:border-cyan-200/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] focus-visible:ring-cyan-300 disabled:cursor-wait disabled:opacity-80"
                }`}
              >
                {identityConfirmed
                  ? "Identity confirm"
                  : scanActive
                    ? "Simulating…"
                    : "Simulate scan"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}
