import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import GlassLayout from "./components/GlassLayout";

export type AuthContextType = "patient-history" | "patient-transfer";

/** Demo login for Patient History → Arvi Sharma report dashboard */
export const PATIENT_HISTORY_DEMO_ID = "hist_doctor_arvi";
export const PATIENT_HISTORY_DEMO_PASSWORD = "arvi_reports_2026";

const validContexts: AuthContextType[] = ["patient-history", "patient-transfer"];

function isAuthContext(v: string | undefined): v is AuthContextType {
  return v !== undefined && validContexts.includes(v as AuthContextType);
}

type AuthenticationProps = {
  /** When used as a routed page, `context` is read from the URL. Optional override for tests or nested use. */
  contextOverride?: AuthContextType;
};

export default function Authentication({ contextOverride }: AuthenticationProps) {
  const { context: paramContext } = useParams<{ context: string }>();
  const context = contextOverride ?? paramContext;
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthContext(context)) {
    return <Navigate to="/tab3" replace />;
  }

  const idLabel = context === "patient-history" ? "Doctor ID" : "Staff ID";
  const requiresTransferDemo = context === "patient-transfer";
  const requiresHistoryDemo = context === "patient-history";

  const canSubmit = useMemo(() => {
    return id.trim().length > 0 && password.trim().length > 0;
  }, [id, password]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const idValue = id.trim();
    const passValue = password.trim();

    if (!idValue || !passValue) {
      setError("Please enter both ID and password.");
      return;
    }

    if (requiresTransferDemo) {
      if (idValue !== "admin_nurse" || passValue !== "smartbed2026") {
        setError("Invalid demo credentials. Use the hint above.");
        return;
      }
      setSuccess("Identity verified. Opening live sensor form…");
      window.setTimeout(() => navigate("/transfer-live"), 400);
      return;
    }

    if (requiresHistoryDemo) {
      if (
        idValue !== PATIENT_HISTORY_DEMO_ID ||
        passValue !== PATIENT_HISTORY_DEMO_PASSWORD
      ) {
        setError("Invalid demo credentials. Use the hint above.");
        return;
      }
      setSuccess("Opening medical report history…");
      window.setTimeout(() => navigate("/patient-history/reports"), 400);
      return;
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-cyan-50 placeholder:text-cyan-200/40 shadow-inner backdrop-blur-md transition focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-950/80";

  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          to="/tab3"
          className="mb-6 text-sm font-medium text-cyan-200/80 transition hover:text-white"
        >
          ← Back to options
        </Link>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150"
        >
          <h1 className="mb-8 text-center text-lg font-semibold tracking-tight text-white">
            {context === "patient-history" ? "Patient History" : "Patient Transfer"}
          </h1>

          {context === "patient-transfer" && (
            <div className="mb-6 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-50/90">
              <p className="font-semibold text-cyan-200">Demo credentials</p>
              <p className="mt-1 font-mono">
                Staff ID: <span className="text-white">admin_nurse</span>
                {"  "}Password: <span className="text-white">smartbed2026</span>
              </p>
            </div>
          )}

          {context === "patient-history" && (
            <div className="mb-6 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-50/90">
              <p className="font-semibold text-cyan-200">Demo credentials</p>
              <p className="mt-1 font-mono">
                Doctor ID:{" "}
                <span className="text-white">{PATIENT_HISTORY_DEMO_ID}</span>
                {"  "}Password:{" "}
                <span className="text-white">{PATIENT_HISTORY_DEMO_PASSWORD}</span>
              </p>
            </div>
          )}

          {(error || success) && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-red-400/40 bg-red-500/10 text-red-100"
                  : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              }`}
              role={error ? "alert" : "status"}
            >
              {error ?? success}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="auth-id"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-cyan-100/80"
              >
                {idLabel}
              </label>
              <input
                id="auth-id"
                name="id"
                type="text"
                autoComplete="username"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className={inputClass}
                placeholder={`Enter ${idLabel}`}
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-cyan-100/80"
              >
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-8 w-full rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/40 to-sky-500/35 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] backdrop-blur-sm transition hover:border-cyan-200/50 hover:shadow-[0_0_32px_rgba(34,211,238,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Submit
          </button>
        </form>
      </div>
    </GlassLayout>
  );
}
