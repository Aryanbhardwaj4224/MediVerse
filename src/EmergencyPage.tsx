import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import GlassLayout from "./components/GlassLayout";
import { captureVideoFrameBase64, formatAuditTime } from "./utils/emergencyAuditFormat";
import { generateAuditReportBlob } from "./utils/emergencyAuditDocx";

/**
 * Original Google Drive enrollment URLs (cannot be read by canvas / face-api in-browser due to CORS):
 * Dr Arpit: https://drive.google.com/uc?id=1EzRPBtJaKdRQsLgdZj31dPXQXaVNoUnu
 * Dr Aryan: https://drive.google.com/uc?id=1BhngQ1IhHmQJHpTHhSA6uDm_9wdtqeRz
 * Serve the same files from public/emergency-refs/ (see Vite public folder).
 */
const doctors = [
  { name: "Dr Arpit", file: "dr-arpit.jpg" },
  { name: "Dr Aryan", file: "dr-aryan.jpg" },
];

/** jsDelivr npm `/weights` path 404s; GitHub tag + raw GitHub are reliable */
const MODEL_URL_FALLBACKS = [
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights",
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/0.22.2/weights",
] as const;

const MATCH_INTERVAL_MS = 500;
const FACE_MATCH_THRESHOLD = 0.45;
const AUDIT_DEBOUNCE_MS = 5000;

const liveTinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 512,
  scoreThreshold: 0.35,
});

const enrollTinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 512,
  scoreThreshold: 0.25,
});

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

function emergencyRefUrl(filename: string): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.href);
  return new URL(`emergency-refs/${filename}`, baseUrl).href;
}

function downscaleToCanvas(
  img: HTMLImageElement,
  maxSide: number
): HTMLCanvasElement {
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const w = w0 > 0 ? w0 : maxSide;
  const h = h0 > 0 ? h0 : maxSide;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(img, 0, 0, nw, nh);
  return canvas;
}

async function loadFaceModels(): Promise<void> {
  const tf = faceapi.tf;
  if (tf?.ready) await tf.ready();
  let lastErr: unknown;
  for (const base of MODEL_URL_FALLBACKS) {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(base);
      await faceapi.nets.faceLandmark68Net.loadFromUri(base);
      await faceapi.nets.faceRecognitionNet.loadFromUri(base);
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  const msg =
    lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`Failed to load face recognition models: ${msg}`);
}

async function buildFaceMatcher(): Promise<{
  matcher: faceapi.FaceMatcher | null;
  error: string | null;
}> {
  const details: string[] = [];
  const labeled: faceapi.LabeledFaceDescriptors[] = [];

  for (const doc of doctors) {
    const url = emergencyRefUrl(doc.file);
    try {
      const head = await fetch(url, { method: "GET", cache: "force-cache" });
      if (!head.ok) {
        details.push(`${doc.name}: HTTP ${head.status} for ${url}`);
        continue;
      }
      const img = await faceapi.fetchImage(url);
      const canvas = downscaleToCanvas(img, 896);
      let det = await faceapi
        .detectSingleFace(canvas, enrollTinyOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!det) {
        const all = await faceapi
          .detectAllFaces(canvas, enrollTinyOptions)
          .withFaceLandmarks()
          .withFaceDescriptors();
        det = all[0];
      }
      if (!det) {
        details.push(`${doc.name}: no face detected in reference image`);
        continue;
      }
      labeled.push(
        new faceapi.LabeledFaceDescriptors(doc.name, [det.descriptor])
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      details.push(`${doc.name}: ${msg}`);
    }
  }

  if (labeled.length === 0) {
    return {
      matcher: null,
      error: details.length ? details.join("\n") : "No descriptors built",
    };
  }

  return {
    matcher: new faceapi.FaceMatcher(labeled, FACE_MATCH_THRESHOLD),
    error: details.length ? details.join("\n") : null,
  };
}

export type AuditLogEntry = {
  name: string;
  time: string;
  step: string;
  snapshotBase64: string;
};

export default function EmergencyPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectLoopRef = useRef<number>(0);
  const lastAuditAtByName = useRef<Record<string, number>>({});

  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [scanActive, setScanActive] = useState(false);
  const [doctorVerified, setDoctorVerified] = useState(false);
  const [captureEnded, setCaptureEnded] = useState(false);

  const [modelsReady, setModelsReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [matcher, setMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [enrollWarning, setEnrollWarning] = useState<string | null>(null);
  const [enrollFatal, setEnrollFatal] = useState<string | null>(null);

  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [overlayName, setOverlayName] = useState("—");
  const [overlayConfidence, setOverlayConfidence] = useState("—");
  const [overlayStatus, setOverlayStatus] = useState("Idle");

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [downloading, setDownloading] = useState(false);

  const matcherReady = !!matcher;
  const allChecklistComplete = useMemo(
    () => CHECKLIST_ITEMS.every((_, i) => checked[i] === true),
    [checked]
  );

  const checklistFullyDone =
    allChecklistComplete && doctorVerified && captureEnded;

  const canAcknowledgeContinue = useMemo(
    () => allChecklistComplete && doctorVerified && captureEnded,
    [allChecklistComplete, doctorVerified, captureEnded]
  );

  const canStartScan =
    matcherReady &&
    !webcamError &&
    !modelError &&
    !enrollFatal &&
    !checklistFullyDone;

  /* Load models + enroll references */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        setModelsReady(true);
        const { matcher: m, error: enrollErr } = await buildFaceMatcher();
        if (cancelled) return;
        setMatcher(m);
        if (!m) {
          setEnrollFatal(
            enrollErr ?? "Reference enrollment failed"
          );
        } else {
          setEnrollFatal(null);
          setEnrollWarning(enrollErr);
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setModelError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const appendAuditIfAllowed = useCallback((name: string, video: HTMLVideoElement) => {
    const now = Date.now();
    const last = lastAuditAtByName.current[name] ?? 0;
    if (now - last < AUDIT_DEBOUNCE_MS) return;
    lastAuditAtByName.current[name] = now;
    const snapshotBase64 = captureVideoFrameBase64(video) ?? "";
    const entry: AuditLogEntry = {
      name,
      time: formatAuditTime(new Date()),
      step: "Step 2",
      snapshotBase64,
    };
    setAuditLogs((prev) => [...prev, entry]);
  }, []);

  /* Webcam only while scanning */
  useEffect(() => {
    if (!scanActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
      setWebcamError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setWebcamError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setWebcamError(`Camera error: ${msg}`);
        setScanActive(false);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, [scanActive]);

  /* When last checklist item is ticked: stop camera, allow acknowledge */
  useEffect(() => {
    if (!doctorVerified) return;
    if (allChecklistComplete) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
      setScanActive(false);
      setCaptureEnded(true);
    } else {
      setCaptureEnded(false);
    }
  }, [allChecklistComplete, doctorVerified]);

  /* Face detection loop (~500ms) */
  useEffect(() => {
    if (!scanActive || !modelsReady || !matcher || webcamError || enrollFatal) {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        detectLoopRef.current = window.setTimeout(tick, MATCH_INTERVAL_MS);
        return;
      }

      if (video.readyState < 2) {
        detectLoopRef.current = window.setTimeout(tick, MATCH_INTERVAL_MS);
        return;
      }

      const displaySize = {
        width: video.videoWidth || video.clientWidth,
        height: video.videoHeight || video.clientHeight,
      };
      if (displaySize.width < 2 || displaySize.height < 2) {
        detectLoopRef.current = window.setTimeout(tick, MATCH_INTERVAL_MS);
        return;
      }

      faceapi.matchDimensions(canvas, displaySize);

      try {
        const det = await faceapi
          .detectSingleFace(video, liveTinyOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!det) {
          setOverlayName("—");
          setOverlayConfidence("—");
          setOverlayStatus("Unknown");
          detectLoopRef.current = window.setTimeout(tick, MATCH_INTERVAL_MS);
          return;
        }

        const resized = faceapi.resizeResults(det, displaySize);
        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);

        const match = matcher.findBestMatch(det.descriptor);
        const confPct = Math.max(
          0,
          Math.min(100, Math.round((1 - match.distance) * 100))
        );

        if (match.label !== "unknown") {
          setOverlayName(match.label);
          setOverlayConfidence(`${confPct}%`);
          setOverlayStatus("Recognized");
          setDoctorVerified(true);
          appendAuditIfAllowed(match.label, video);
        } else {
          setOverlayName("—");
          setOverlayConfidence(`${confPct}%`);
          setOverlayStatus("Unknown");
        }
      } catch {
        setOverlayName("—");
        setOverlayConfidence("—");
        setOverlayStatus("Unknown");
      }

      detectLoopRef.current = window.setTimeout(tick, MATCH_INTERVAL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(detectLoopRef.current);
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    };
  }, [
    scanActive,
    modelsReady,
    matcher,
    webcamError,
    enrollFatal,
    appendAuditIfAllowed,
  ]);

  /* Idle / not scanning: reset live HUD (keep doctorVerified + audit) */
  useEffect(() => {
    if (scanActive) return;
    setOverlayName("—");
    setOverlayConfidence("—");
    setOverlayStatus("Idle");
  }, [scanActive]);

  function toggleItem(index: number) {
    if (!doctorVerified) return;
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleAcknowledgeContinue() {
    if (!canAcknowledgeContinue) return;
    navigate("/vitalweave-nexus");
  }

  async function handleDownloadAudit() {
    if (auditLogs.length === 0) return;
    setDownloading(true);
    try {
      const blob = await generateAuditReportBlob(auditLogs);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "audit-report.docx";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  const verificationHeadline = enrollFatal
    ? `Cannot verify — reference enrollment failed.\n${enrollFatal}`
    : modelError
      ? `Cannot verify — ${modelError}`
      : webcamError
        ? webcamError
        : !scanActive
          ? "Press Start scanning to begin."
          : !doctorVerified && overlayName === "—" && overlayConfidence === "—"
            ? "Not verified — no face detected. Center your face in the frame."
            : doctorVerified
              ? `Face verified — ${overlayName}`
              : `Not verified — face does not match enrolled doctors (confidence ${overlayConfidence}).`;

  const bannerTone = enrollFatal || modelError || webcamError
    ? "border-red-400/50 bg-red-500/15 text-red-100"
    : !scanActive
      ? "border-cyan-400/35 bg-slate-950/70 text-cyan-100"
      : doctorVerified
        ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-100"
        : "border-amber-400/40 bg-amber-500/10 text-amber-100";

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
            <section className="flex flex-col">
              <h2 className="mb-6 text-lg font-semibold leading-snug text-cyan-300 sm:text-xl">
                WHO Guide: Pre-arrival Preparations
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-cyan-50/75">
                Checklist stays locked until your face matches an enrolled doctor
                on the right. After verification, tick items while the camera runs.
                When the last item is checked, the camera stops — then you can
                acknowledge.
              </p>
              <ul className="flex flex-col gap-3.5">
                {CHECKLIST_ITEMS.map((item, index) => (
                  <li key={item}>
                    <label
                      className={`group flex items-start gap-3 rounded-xl border border-transparent px-2 py-1.5 transition ${
                        doctorVerified
                          ? "cursor-pointer hover:border-white/10 hover:bg-white/5"
                          : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checked[index]}
                        disabled={!doctorVerified}
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
                    : !doctorVerified
                      ? "Verify as an enrolled doctor first (Start scanning)"
                      : !allChecklistComplete
                        ? "Tick every checklist item"
                        : "Camera must stop after the last item — complete the checklist"
                }
                className="mt-8 w-full rounded-2xl border border-white/25 bg-white/15 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 enabled:hover:border-cyan-300/50 enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-cyan-100/40"
              >
                Acknowledge &amp; Continue
              </button>
              {!canAcknowledgeContinue && (
                <p className="mt-2 text-center text-xs text-cyan-200/50">
                  {!doctorVerified && (
                    <>
                      Tap <strong className="text-cyan-100/90">Start scanning</strong>{" "}
                      on the right, then wait for{" "}
                      <span className="text-cyan-100/80">Face verified</span>.
                      <br />
                    </>
                  )}
                  {doctorVerified && !allChecklistComplete && (
                    <>
                      Tick every checklist item — camera stays on until the last tick.
                      <br />
                    </>
                  )}
                  {doctorVerified &&
                    allChecklistComplete &&
                    !captureEnded && (
                      <span>Finishing camera shutdown…</span>
                    )}
                </p>
              )}
            </section>

            {/* Live face verification — replaces prior embedded video */}
            <section className="flex flex-col">
              <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
                Doctor Face Verification
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-cyan-50/75">
                Live webcam with face-api.js. Reference photos match{" "}
                <strong className="text-cyan-100">Dr Arpit</strong> and{" "}
                <strong className="text-cyan-100">Dr Aryan</strong> (same-origin
                files under <code className="text-cyan-200/90">/emergency-refs/</code>
                ). Tap <strong className="text-cyan-100">Start scanning</strong> to
                begin (~500&nbsp;ms detection interval).
              </p>

              <div
                className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-black/50 shadow-[0_0_40px_rgba(34,211,238,0.2),inset_0_0_60px_rgba(34,211,238,0.08)]"
                aria-live="polite"
              >
                <div className="pointer-events-none absolute inset-0 z-10 ring-2 ring-inset ring-cyan-300/20" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[length:100%_4px] opacity-40" />
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  <div className="animate-emergency-scan absolute left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" />
                </div>
                <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                  Live feed · encrypted
                </div>

                {!webcamError ? (
                  <>
                    <video
                      ref={videoRef}
                      className="h-[320px] w-full object-cover object-center sm:h-[400px] md:h-[460px]"
                      autoPlay
                      muted
                      playsInline
                      aria-label="Webcam for face verification"
                    />
                    <canvas
                      ref={canvasRef}
                      className="pointer-events-none absolute left-0 top-0 z-[15] h-[320px] w-full sm:h-[400px] md:h-[460px]"
                    />
                  </>
                ) : (
                  <div className="flex h-[320px] w-full items-center justify-center bg-slate-900/90 p-6 text-center text-sm text-cyan-100/80 sm:h-[400px] md:h-[460px]">
                    <div className="rounded-xl border border-cyan-400/30 bg-slate-950/80 px-4 py-3 backdrop-blur-sm">
                      {webcamError}
                    </div>
                  </div>
                )}

                {scanActive && !webcamError && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-cyan-500/10 backdrop-blur-[1px]">
                    <span className="rounded-full border border-cyan-300/50 bg-slate-950/70 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan-200">
                      Scanning…
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`mb-4 mt-4 whitespace-pre-line rounded-2xl border px-4 py-3 text-center text-sm font-semibold leading-snug shadow-lg backdrop-blur-sm sm:text-base ${bannerTone}`}
              >
                {verificationHeadline}
              </div>

              {enrollWarning && !enrollFatal && (
                <p className="mb-2 text-center text-xs text-amber-200/90">
                  Note: {enrollWarning}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-center text-xs sm:text-sm">
                <div>
                  <div className="text-cyan-200/70">Name</div>
                  <div className="font-medium text-white">{overlayName}</div>
                </div>
                <div>
                  <div className="text-cyan-200/70">Confidence</div>
                  <div className="font-medium text-white">{overlayConfidence}</div>
                </div>
                <div>
                  <div className="text-cyan-200/70">Status</div>
                  <div className="font-medium text-white">
                    {scanActive ? overlayStatus : "Idle"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  disabled={!canStartScan || scanActive}
                  onClick={() => setScanActive(true)}
                  className="flex-1 rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/35 to-sky-500/30 px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:border-cyan-200/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {scanActive ? "Scanning…" : "Start scanning"}
                </button>
                <button
                  type="button"
                  disabled={!scanActive}
                  onClick={() => setScanActive(false)}
                  className="flex-1 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-center text-sm font-semibold text-cyan-50 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Stop scanning
                </button>
              </div>

              <button
                type="button"
                disabled={auditLogs.length === 0 || downloading}
                onClick={() => void handleDownloadAudit()}
                className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-cyan-50 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {downloading ? "Preparing…" : "Download Audit Report"}
              </button>

              <div
                className={`mt-4 w-full rounded-2xl border px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.15em] backdrop-blur-md ${
                  doctorVerified
                    ? "border-emerald-300/50 bg-gradient-to-r from-emerald-400/35 to-teal-400/30 text-emerald-50 shadow-[0_0_28px_rgba(52,211,153,0.35)]"
                    : "border-cyan-300/40 bg-slate-950/60 text-cyan-100"
                }`}
              >
                {doctorVerified ? "Identity confirm" : "Identity pending"}
              </div>
            </section>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}
